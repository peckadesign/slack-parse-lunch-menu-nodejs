var request = require('request');
var cheerio = require('cheerio');
var moment = require('moment');
var stdio = require('stdio');
var ops = stdio.getopt({
    'restaurant': {args: 1, mandatory: true, description: 'Restaurant to parse'},
    'url': {args: 1, mandatory: true, description: 'Url to post'}
});

var url = null;
var parse = null;
switch (ops.restaurant) {
    case 'racek':
        url = 'http://www.restaurace-racek.cz/sluzby/';
        parse = function ($) {
            var text = null;
            $('.wsw table tbody').each(function () {
                var $this = $(this);
                $this.html($this.html().replace(/\t|\n|[ ]{2}/g, ''));
                $this.find("tr").each(function () {
                    var $this = $(this);
                    var secondColumn = $this.find('td:nth-child(2)');
                    if (!secondColumn.text().trim()) {
                        $this.remove();
                    } else {
                        var firstColumn = $this.find('td:nth-child(1)');

                        if (firstColumn.text().trim()) {
                            firstColumn.text('\t' + firstColumn.text() + '\t');
                        }
                        secondColumn.text(secondColumn.text() + '\t');
                        $this.replaceWith('\n' + $this.text());
                    }
                });

                text = $this.text();
            });

            return text;
        };
        break;

    case 'cestovatele':
        url = 'https://www.hedvabnastezka.cz/klub-cestovatelu-brno/poledni-menu-2/';
        parse = function ($) {
            var date = moment().day();
            var text = $('.article-content').text();
            var smallText = $('.article-content').text().toLowerCase();
            var from = null;
            var dailyMenu = null;

            switch (date) {
                case 1:
                    dailyMenu = text.substring(from = smallText.indexOf('pondělí'), smallText.indexOf('úterý',from)).trim();
                    break;
                case 2:
					dailyMenu = text.substring(from = smallText.indexOf('úterý'), smallText.indexOf('středa',from)).trim();
					break;
                case 3:
					dailyMenu = text.substring(from = smallText.indexOf('středa'), smallText.indexOf('čtvrtek',from)).trim();
					break;
                case 4:
					dailyMenu = text.substring(from = smallText.indexOf('čtvrtek'), smallText.indexOf('pátek',from)).trim();
					break;
                case 5:
					dailyMenu = text.substring(from = smallText.indexOf('pátek'), smallText.indexOf('restaurace',from)).trim();
					break;
                default:
                    return "Dneska se nevaří";
            }

            return dailyMenu;
        };
        break;

	case 'napurkynce':
		url = 'http://www.napurkynce.cz/denni-menu/';
		parse = function ($) {
			var date = moment().day();
			var text = $('#content').text();
			var from = null;

			switch (date) {
				case 1:
					return text.substring(from = text.indexOf('Pondělí'), text.indexOf('Úterý',from)).trim();
				case 2:
					return text.substring(from = text.indexOf('Úterý'), text.indexOf('Středa', from)).trim();
				case 3:
					return text.substring(from = text.indexOf('Středa'), text.indexOf('Čtvrtek',from)).trim();
				case 4:
					return text.substring(from = text.indexOf('Čtvrtek'), text.indexOf('Pátek',from)).trim();
				case 5:
					return text.substring(from = text.indexOf('Pátek'), text.length).trim();
				default:
					return "Pizza time";
			}
		};
		break;

    case 'ocean':
        url = 'http://www.ocean48.cz/bistro/nabidka';
        parse = function ($) {
            var leftHalfCol = $('.content .left-half.col');
            if (leftHalfCol.find('p').length) {
                return url;
            }
            var text = null;
            leftHalfCol.each(function () {
                var $this = $(this);
                $this.html($this.html().replace(/\r\n|\t|\n|[ ]{2}/g, ''));

                var menu = $this.find('table.bistro-menu');
                menu.not(menu = menu.first()).remove();

                var title = $this.find('> h2');
                title.not(title = title.first()).remove();
                title.text(title.text() + '\n');

                menu.find('tr td.price').each(function () {
                    var $this = $(this);
                    $this.text('\t' + $this.text() + '\n');
                });

                menu.find('tr td.menu-item-text-col span.small').each(function () {
                    var $this = $(this);
                    if ($this.text().trim()) {
                        $this.text('\n\t' + $this.text());
                    }
                });

                text = $this.text()

            });
            return text;
        };
        break;

    case 'padthai':
        url = 'https://www.zomato.com/cs/brno/pad-thai-kr%C3%A1lovo-pole-brno-sever/';
        parse = function ($) {
            var text = null;
            $('#tabtop .menu-preview.bb5').each(function () {
                var $this = $(this);
                $this.html($this.html().replace(/\t|\n|[ ]{2}/g, ''));

                $this.find('.res-info-headline span.hdn').remove();
                var span = $this.find('.res-info-headline span');
                span.text('\t' + span.text());
                var time = $this.find('.res-info-headline .dm-serving-time');
                time.text('\t' + time.text() + '\n');
                $this.find('.tmi-groups .tmi-group .tmi-daily .tmi-price').each(function () {
                    var $this = $(this);
                    $this.text('\t' + $this.text() + '\n');
                });

                text = $this.text();
            });

            return text;
        };
        break;

	case 'tasteOfIndia':
		url = 'https://www.taste-of-india.cz/';
		parse = function ($) {
			var date = moment().day();
			var ul = $('ul.daily-menu li');
			var text = '';
			var day = 'Pondělí';

			switch (date) {
				case 1:
					day = 'Pondělí';
					break;
				case 2:
					day = 'Úterý';
					break;
				case 3:
					day = 'Středa';
					break;
				case 4:
					day = 'Čtvrtek';
					break;
				case 5:
					day = 'Pátek';
					break;
				default:
					return "Dneska se nevaří";
			}

			ul.each(function () {
				if ($(this).text().trim().includes(day,0)) {
					text = text + $(this).text().trim();
				}
			});

			return text.replace(/(\d{1,2}[.]{1}\s?\d{1,2}[.]{1})/gi, '$1\n').replace(/Kč\s*/gi, 'Kč\n');

		};
		break;
		
	case 'corrida':
		url = 'http://www.lacorrida.cz/zabovresky/';
		parse = function ($) {
			text = '';
			
			$('#tabs-' + moment().day()).find('.menu-con').text().trim().split('\n').map(function (e) {
				if (e.trim() != '') {
					text += e.trim().replace(/(\d+,-)/gi, ' $1') + '\n';
				}
			});
			
			return text;

		};
		break;

    case 'liquid':
		url = 'http://www.liquidbread.cz/liquidbread/liquidbread/mainmenu/daily-menu/';
		parse = function ($) {
            var days = ["PONDĚLÍ", "ÚTERÝ", "STŘEDA", "ČTVRTEK", "PÁTEK"];
            var actualDayNumber = moment().day();

			var text = $('#content').first().text();
            
            var start = text.indexOf(days[actualDayNumber - 1]);
            var end = null;

            if (actualDayNumber == 5) {
                end = text.length;
            } else {
                end = text.indexOf(days[actualDayNumber]);
            }
			
			text = text.substring(start, end).replace(/(a\)|b\)|c\)|Dezert)/g, "\n$1");
			
			return text;

		};
		break;

	case 'selepova':
		url = 'https://www.selepova.cz/denni-menu/';
		parse = function ($) {
			var date = moment().format("D");

			text = "Dnes je zavřeno";

			var days = $('.content .den');
			days.each(function(day) {
				if($(this).find('.cislo').text() == date) {
					text = $(this).find('.seznam .polevka').text().trim();
					$(this).find('li').each(function(jidlo) {
						text += "\n" + (jidlo + 1) + ". " + $(this).text().trim();
					});
				}
			});

			return text;
		};

		break;



    default:
        console.log('neznámá restaurace');
        process.exit();
        break;

}

request(url, function (error, response, html) {
    if (!error) {
        request.post({
            uri: ops.url,
            json: true,
            body: {
                text: parse(cheerio.load(html))
            }
        }, function (error, response) {
            console.log(error ? error : response.body);
        });
    } else {
        console.log(error);
    }
});
