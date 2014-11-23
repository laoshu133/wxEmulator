function opensvurl() {
    var href = $("#svurl").attr("href");
    window.open(href, "_blank");
}

function popensvurl(href) {
    if (href) window.open(href, "_blank");
}

function toggle(type) {
    curtype = type;
    $('.content_type').hide();
    $("#" + curtype).show();

    buildRequest(type);
    $('#receive').text('');
    $('#svposttext').hide();
    $('#svtext').hide();
    $('#svurlbox').hide();
    $('#sendxml').attr('readonly', 'readonly');
    if (type == 'other') {
        $('#sendxml').removeAttr('readonly');
    }
}

function getxml(xml) {
    var xmlobject = null;
    try {
        if (window.ActiveXObject) {
            xmlobject = new ActiveXObject("Microsoft.XMLDOM");
            xmlobject.async = "false";
            xmlobject.loadXML(xml);
        } else { // 用于 Mozilla, Firefox, Opera, 等浏览器的代码：
            var parser = new DOMParser();
            xmlobject = parser.parseFromString(xml, "text/xml");
        }
    } catch (e) {
        alert("您的浏览器不支持模拟测试");
    }
    return xmlobject;
}

function buildRequest(type) {
    var $demoSendBox = $('#demoSendBox');
    $('span.time', $demoSendBox).show();
    $('div.mediaImg', $demoSendBox).show();
    $('div.mediaContent', $demoSendBox).show();
    $('div.mediaFooterbox', $demoSendBox).show();
    var time = Math.round(new Date().getTime() / 1000);
    xml = "<xml>\n" +
        "    <ToUserName><![CDATA[" + $('#touser').val() + "]]></ToUserName>\n" +
        "    <FromUserName><![CDATA[" + $('#fromuser').val() + "]]></FromUserName>\n" +
        "    <CreateTime>" + time + "</CreateTime>\n";
    if (type == 'text') {
        xml += "    <MsgType><![CDATA[text]]></MsgType>\n";
        xml += "    <Content><![CDATA[" + $('#contentvalue').val() + "]]></Content>\n";
        $('#svpostinfo').text($('#contentvalue').val());
    } else if (type == 'image') {
        xml += "    <MsgType><![CDATA[image]]></MsgType>\n";
        xml += "    <PicUrl><![CDATA[" + $('#picurl').val() + "]]></PicUrl>\n";
        xml += "    <MediaId><![CDATA[" + $('#mediaid').val() + "]]></MediaId>\n";
        $('#svpostinfo').html('<img height="114" width="153" src="' + $('#picurl').val() + '">');
    } else if (type == 'voice') {
        xml += "    <MsgType><![CDATA[voice]]></MsgType>\n";
        xml += "    <MediaId><![CDATA[" + $('#mediaid').val() + "]]></MediaId>\n";
        xml += "    <Format><![CDATA[" + $('#format').val() + "]]></Format>\n";
        xml += "    <Recognition><![CDATA[" + $('#recognition').val() + "]]></Recognition>\n";
        $('#svpostinfo').html('<img src="images/voice.jpeg">');
    } else if (type == 'video') {
        xml += "    <MsgType><![CDATA[video]]></MsgType>\n";
        xml += "    <MediaId><![CDATA[" + $('#mediaid').val() + "]]></MediaId>\n";
        xml += "    <ThumbMediaId><![CDATA[" + $('#thumbmediaid').val() + "]]></ThumbMediaId>\n";
        $('#svpostinfo').html('<img src="images/video.jpeg">');
    } else if (type == 'location') {
        xml += "    <MsgType><![CDATA[location]]></MsgType>\n";
        xml += "    <Location_X>" + parseFloat($('#location_x').val()) + "</Location_X>\n";
        xml += "    <Location_Y>" + parseFloat($('#location_y').val()) + "</Location_Y>\n";
        xml += "    <Scale><![CDATA[" + $('#scale').val() + "]]></Scale>\n";
        xml += "    <Label><![CDATA[" + $('#label').val() + "]]></Label>\n";
        $('span.time', $demoSendBox).hide();
        $('div.mediaImg', $demoSendBox).hide();
        $('div.mediaContent', $demoSendBox).hide();
        $('#svpostinfo').html('<img src="images/location.jpeg">');
    } else if (type == 'link') {
        xml += "    <MsgType><![CDATA[link]]></MsgType>\n";
        xml += "    <Title><![CDATA[" + $('#linktitle').val() + "]]></Title>\n";
        xml += "    <Description><![CDATA[" + $('#linkdescription').val() + "]]></Description>\n";
        xml += "    <Url><![CDATA[" + $('#linkurl').val() + "]]></Url>\n";
        $('#svpostinfo').html('<img src="images/link.jpeg">');
    } else if (type == 'subscribe') {
        xml += "    <MsgType><![CDATA[event]]></MsgType>\n";
        xml += "    <Event><![CDATA[subscribe]]></Event>\n";
        xml += "    <EventKey><![CDATA[]]></EventKey>\n";
    } else if (type == 'unsubscribe') {
        xml += "    <MsgType><![CDATA[event]]></MsgType>\n";
        xml += "    <Event><![CDATA[unsubscribe]]></Event>\n";
        xml += "    <EventKey><![CDATA[]]></EventKey>\n";
    } else if (type == 'menu') {
        xml += "    <MsgType><![CDATA[event]]></MsgType>\n";
        xml += "    <Event><![CDATA[CLICK]]></Event>\n";
        xml += "    <EventKey><![CDATA[" + $('#event_key').val() + "]]></EventKey>\n";
    }
    xml += "    <MsgId>1234567890abcdef</MsgId>\n" +
        "</xml>";
    if (type == 'other') {
        xml = $('#sendxml').val();
    }
    $('#sendxml').val(xml);
}

function checkSignature() {
    var mpUrl = $.trim($('#mpurl').val());
    var mpToken = $.trim($('#mptoken').val());

    if(!mpUrl || !mpToken) {
        alert('接口 URL 或 Token 未填写！');
        return;
    }

    $.ajax('act/', {
        type: 'post',
        dataType: 'json',
        data: {
            mpurl: mpUrl,
            mptoken: mpToken
        },
        timeout: 5000,
    })
    .done(function(data) {
        if(data.status === 'success') {
            alert('Token 校验成功');
        }
        else {
            alert('Token 校验失败');
        }
    })
    .fail(function() {
        alert('接口无响应或超时！');
    });
}

function submitform() {
    buildRequest(curtype);
    $('#svtext').hide();
    $('#svurlbox').hide();
    $('#svinfolist').hide();
    $('div.mediaFooterbox', $('#demoSendBox')).show();
    $.ajax('url/', {
        type: "POST",
        dataType: "text",
        data: {
            mpurl: $('#mpurl').val(),
            mptoken: $('#mptoken').val(),
            mpxml: $('#sendxml').val().replace(/[\r\n]/g, ""),
        },
        beforeSend: function() {
            if ($('#mpurl').val() == "") {
                alert("接口URL未填写");
                return;
            }
            if ($('#mpurl').val().substring(0, 7) != "http://") {
                alert("接口URL需要以http://开头");
                return;
            }
            if (curtype != 'subscribe' && curtype != 'unsubscribe') {
                if (curtype == 'text' || curtype == 'image' || curtype == 'voice' || curtype == 'video' || curtype == 'link' || curtype == 'location') {
                    $('#svposttext').show();
                }
            }
            $('#donation').hide();
            // $('#svposttext').show();
            $('#receive').text('加载中。。。');
        },
        success: function(s) {
            var xmlobject = getxml(s);
            if (xmlobject) {
                var xmlobj = xmlobject.getElementsByTagName("xml");
                if (xmlobj.length) {
                    var xmls = xmlobj.item(0);
                    var xml = xmls;
                    var FromUserName = xml.getElementsByTagName("FromUserName")[0].firstChild.nodeValue;
                    var ToUserName = xml.getElementsByTagName("ToUserName")[0].firstChild.nodeValue;
                    var MsgType = xml.getElementsByTagName("MsgType")[0].firstChild.nodeValue;

                    if (MsgType == 'text') {
                        var Content = xml.getElementsByTagName("Content")[0].firstChild.nodeValue;
                        Content = nl2br(Content);
                        $('#svtext').show().find('div.btn').html(Content);
                    } else if (MsgType == 'news') {
                        var Title = xml.getElementsByTagName("Title")[0].firstChild.nodeValue;
                        var Description = xml.getElementsByTagName("Description")[0].firstChild.nodeValue;
                        var PicUrl = xml.getElementsByTagName("PicUrl")[0].firstChild.nodeValue;
                        var Url = xml.getElementsByTagName("Url")[0].firstChild.nodeValue;
                        if (Url.indexOf('http://') == -1 && Url.indexOf('https://') == -1) {
                            Url = '../app/' + Url;
                        }
                        $('#svtitle').html(Title);
                        $('#svinfo').html(Description);
                        $('#svpic').attr('src', PicUrl);
                        $('#svurlbox').show().find('a#svurl').attr('href', Url);
                        var titleObj = xml.getElementsByTagName("Title");
                        if (titleObj.length > 1) {
                            var svinfolist = imghtml = '';
                            var UrlObj = xml.getElementsByTagName("Url");
                            var PicUrlObj = xml.getElementsByTagName("PicUrl");
                            for (var ti = 1; ti < titleObj.length; ti++) {
                                imghtml = PicUrlObj[ti].firstChild.nodeValue ? '<img align="right" src="' + PicUrlObj[ti].firstChild.nodeValue + '">' : '';
                                svinfolist += '<p class="clearfix" onclick="popensvurl(\'' + UrlObj[ti].firstChild.nodeValue + '\')">' + titleObj[ti].firstChild.nodeValue + imghtml + '</p>';
                            }
                            $('div.mediaFooterbox', $('#demoSendBox')).hide();
                            $('#svinfolist').show().html(svinfolist);
                        }
                    }
                }
            }
            $('#receive').text(s);
        },
        error: function() {
            alert("接口无响应或超时！");
        },
        timeout: 10000
    })
}

function nl2br(str, is_xhtml) {
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br ' + '/>' : '<br>'; // Adjust comment to avoid issue on phpjs.org display
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}