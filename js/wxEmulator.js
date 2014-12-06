/**
 * wxEmulator
 * ---
 */

define(['jquery', 'template'], function($, template) {
    var utils = {
        queryString: function(name, search) {
            search = search || location.search;

            var re = new RegExp('(?:^|\\?|&)' + name + '=([^&]+)');
            if(re.test(search)) {
                return decodeURIComponent(RegExp.$1);
            }

            return '';
        }
    };

    var wxEmulator = {
        init: function() {
            this.chatShell = $('#J_ChatShell');
            this.typePanels = $('.content_type').hide();
            this.resultElem = $('#J_Result');
            this.xmlInp = $('#J_Mpxml');
            this.form = $('#J_WxForm');

            this.toggleType(this.type);
            this.initEvent();

            var url = utils.queryString('url');
            if(url) {
                $('#mpurl').val(url);
            }
            var token = utils.queryString('token');
            if(token) {
                $('#mptoken').val(token);
            }
        },
        initEvent: function() {
            var self = this;
            var form = this.form;

            // post
            form.on('submit', function(e) {
                e.preventDefault();

                self.postMessage();
            });

            // 效验签名
            $('#J_CheckSignature').on('click', function() {
                self.checkSignature();
            });

            // type toggle
            form.delegate('[name=type]', 'change', function() {
                if(!this.checked) {
                    return;
                }

                self.toggleType(this.value);
            });

            // message
            var chatShell = this.chatShell;
            chatShell.parent().delegate('.clear', 'click', function() {
                chatShell.html('');
            });
            $(document).on('keyup', function(e) {
                if(!e.altKey ||
                    /(?:input|textarea)/i.test(e.target.nodeName)
                ) {
                    return;
                }

                var keyCode = e.keyCode;
                // console.log(keyCode);
                if(keyCode === 88) {
                    chatShell.html('');
                }
                else if(keyCode == 83) {
                    self.form.trigger('submit');
                }
            });
        },
        type: 'text',
        toggleType: function(type) {
            this.type = type;

            this.typePanels.hide();
            $('#' + type).show();

            this.resultElem.html('');
            this.createMessage(type);
            this.xmlInp.prop('readonly', type !== 'other');
        },
        createMessage: function() {
            if(this.type === 'other') {
                return {
                    xml: this.xmlInp.val(),
                    type: this.type
                };
            }

            var xmlTmpl = [
                '<xml>',
                '<ToUserName><![CDATA[{{touser}}]]></ToUserName>',
                '<FromUserName><![CDATA[{{fromuser}}]]></FromUserName>',
                '<CreateTime>{{now}}</CreateTime>',
                '<MsgType><![CDATA[{{msgType}}]]></MsgType>',
                '{{if type === "text"}}',
                    '<Content><![CDATA[{{content}}]]></Content>',
                '{{else if type === "image"}}',
                    '<PicUrl><![CDATA[{{picurl}}]]></PicUrl>',
                '{{else if type === "subscribe"}}',
                    '<Event><![CDATA[subscribe]]></Event>',
                    '<EventKey><![CDATA[]]></EventKey>',
                '{{else if type === "unsubscribe"}}',
                    '<Event><![CDATA[unsubscribe]]></Event>',
                    '<EventKey><![CDATA[]]></EventKey>',
                '{{else if type === "menu"}}',
                    '<Event><![CDATA[CLICK]]></Event>',
                    '<EventKey><![CDATA[{{event_key}}]]></EventKey>',
                "{{/if}}",
                '{{if mediaid}}',
                    '<MediaId><![CDATA[{{mediaid}}]]></MediaId>',
                "{{/if}}",
                '<MsgId>1234567890abcdef</MsgId>',
                '</xml>'
            ].join('\n');

            var xmlData = {};
            $.each(this.form.prop('elements'), function() {
                var type = this.type;
                if(this.offsetWidth <=0 ||
                    type === 'button' || type === 'submit'
                ) {
                    return;
                }

                var val, k = this.id;

                if(type === 'radio' || type === 'checkbox') {
                    k = this.name;
                    if(this.checked) {
                        val = this.value;
                    }
                }
                else {
                    val = this.value;
                }

                if(val !== undefined) {
                    xmlData[k] = val;
                }
            });

            xmlData.msgType = xmlData.type;
            if(/subscribe|menu/i.test(xmlData.type)) {
                xmlData.msgType = 'event';
            }

            var render = template.compile(xmlTmpl);
            var xml = render(xmlData).replace(/\n+/g, '\n');

            this.xmlInp.val(xml);
            xmlData.xml = xml;
            return xmlData;
        },
        messageTypeParses: {
            text: function(ret) {
                if(!ret.content) {
                    ret.chatType = 'tips';
                    ret.content = '该公众号暂时无法提供服务，请稍后再试';
                }
            },
            event: function(ret) {
                ret.chatType = 'tips';
                ret.content = [
                    'Event: ' + ret.event,
                    ', EventKey: ' + ret.eventKey
                ].join(' ');
            }
        },
        parseXMLData: function(chatType, xml) {
            var doc, ret = null;
            if(xml === '') {
                return {};
            }

            try{
                doc = $($.parseXML(xml));
            }
            catch(ex) {
                console.log('xml parse error', ex);
            }

            if(!doc) {
                return ret;
            }

            ret = {
                chatType: chatType
            };

            var rArrs = /^articles$/;
            function parse(node, data) {
                var inx = undefined;
                if('length' in data) {
                    inx = 0;
                }
                node.children().each(function() {
                    var name = this.nodeName;
                    name = name.slice(0, 1).toLowerCase() + name.slice(1);

                    var node = $(this);
                    var k = isFinite(inx) ? inx ++ : name;

                    if(!node.children().length) {
                        data[k] = node.text();
                    }
                    else {
                        data[k] = rArrs.test(name) ? [] : {};
                        parse(node, data[k], 0);
                    }
                });
            }

            parse(doc.find('xml'), ret);

            var type = ret.type = ret.msgType;
            var handler = this.messageTypeParses[type];
            if(handler) {
                ret = handler.call(this, ret, doc) || ret;
            }

            return ret;
        },
        // message
        addMessage: function(data) {
            if(!data || !data.chatType) {
                return;
            }

            var shell = this.chatShell;
            var msgTmpl = [
                '<div class="chat chat-{{chatType}}">',
                '{{if (chatType === "post" || chatType === "reply") && (type !== "news")}}',
                '<span class="avatar"><img src="images/{{chatType === "post" ? "user.gif" : "weixin.jpg"}}" height="34" width="34" alt=""></span>',
                '{{/if}}',
                '{{if type === "news"}}',
                    '<div class="chat-news"><ul>',
                        '{{each articles as item inx}}',
                            '<li><a href="{{item.url}}" class="{{inx === 0 ? "first" : ""}}" target="_blank"><i class="pic" style="background-image:url({{item.picUrl}})"></i><span class="tit">{{item.title}}</span></a></li>',
                        '{{/each}}',
                    '</ul></div>',
                '{{else}}',
                    '<div class="chat-inner">{{content}}</div></div>',
                '{{/if}}',
            ].join('');

            var render = template.compile(msgTmpl);
            var html = render(data);

            shell.append(html);
        },
        addErrorTips: function(msg) {
            return this.addMessage({
                chatType: 'error',
                content: msg
            });
        },
        postMessage: function() {
            var self = this;
            var mpUrl = $.trim($('#mpurl').val());
            var mpToken = $.trim($('#mptoken').val());

            if(!mpUrl || !mpToken) {
                self.showError('接口 URL 或 Token 未填写！');
                return;
            }

            this.createMessage(this.type);

            var xml = this.xmlInp.val();
            var xmlData = this.parseXMLData('post', xml);
            if(!xmlData) {
                self.showError('发送内容 XML 解析失败！');
                return;
            }

            this.addMessage(xmlData);

            var resultElem = this.resultElem;
            resultElem.html('Loading...');

            $.ajax(this.form.attr('action'), {
                type: 'post',
                dataType: 'json',
                data: {
                    mptoken: mpToken,
                    mpurl: mpUrl,
                    mpxml: xml
                },
                timeout: 10000
            })
            .done(function(ret) {
                if(ret.status !== 'success') {
                    self.addErrorTips(ret.message || '处理失败！');
                    return;
                }

                resultElem.text(ret.result);

                var xmlData = self.parseXMLData('reply', ret.result);
                if(!xmlData) {
                    self.addErrorTips('接收内容 XML 解析失败！');
                    return;
                }

                self.addMessage(xmlData);
            })
            .fail(function() {
                self.addErrorTips('接口无响应或超时！');
            });
        },
        checkSignature: function() {
            var self = this;
            var mpUrl = $.trim($('#mpurl').val());
            var mpToken = $.trim($('#mptoken').val());

            if(!mpUrl || !mpToken) {
                self.showError('接口 URL 或 Token 未填写！');
                return;
            }

            $.ajax(this.form.attr('action'), {
                type: 'post',
                dataType: 'json',
                data: {
                    a: 'checkSignature',
                    mptoken: mpToken,
                    mpurl: mpUrl
                },
                timeout: 5000
            })
            .done(function(data) {
                if(data.status === 'success') {
                    self.showError('Token 校验成功');
                }
                else {
                    self.showError('Token 校验失败');
                }
            })
            .fail(function() {
                self.showError('接口无响应或超时！');
            });
        },
        showError: function(msg) {
            alert(msg);
        }
    };

    return wxEmulator;
});