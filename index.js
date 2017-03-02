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
        url = 'http://www.hedvabnastezka.cz/klub-cestovatelu-brno/poledni-menu-2/';
        parse = function ($) {
            var date = moment().day();
            var text = $('.article-content').text();
            var from = null;

            switch (date) {
                case 1:
                    return text.substring(from = text.indexOf('pondělí'), text.indexOf('úterý',from));
                case 2:
                    return text.substring(from = text.indexOf('úterý'), text.indexOf('středa',from));
                case 3:
                    return text.substring(from = text.indexOf('středa'), text.indexOf('čtvrtek',from));
                case 4:
                    return text.substring(from = text.indexOf('čtvrtek'), text.indexOf('pátek',from));
                case 5:
                    return text.substring(from = text.indexOf('pátek'), text.indexOf('Restaurace Klub cestovatelů, Veleslavínova 14, Brno, Královo pole',from));
                default:
                    return "Dneska se nevaří";
            }
        };
        break;

	case 'borgeska':
		url = 'http://www.restauraceborgeska.cz/';
		parse = function ($) {
			var date = moment().day();
			var master = $('#proweb-body');

			var text = null;
			master.each(function () {
				var $thisMaster = $(this);
				$thisMaster.html($thisMaster.html().replace(/\r\n|\t|\n|[ ]{2}/g, ''));

				var menuMaster = master.find('table tbody');
				menuMaster.find('tr').each(function () {
					var $thisMaster = $(this);
					$thisMaster.html(' ' + $thisMaster.html() + '\n\n');
				});
				master = $thisMaster.text();

				switch (date) {
					case 1:
						text = master.substring(from = master.indexOf('PO:'), master.indexOf('ÚT:', from));
						break;
					case 2:
						text = master.substring(from = master.indexOf('ÚT:'), master.indexOf('ST:', from));
						break;
					case 3:
						text = master.substring(from = master.indexOf('ST:'), master.indexOf('ČT:', from));
						break;
					case 4:
						text = master.substring(from = master.indexOf('ČT:'), master.indexOf('PÁ:', from));
						break;
					case 5:
						text = master.substring(from = master.indexOf('PÁ:'), master.indexOf('©', from));
						break;
					default:
						text = "Dneska se nevaří";
						break;
				}

				text = text.replace(/g/g, 'g ');
			});

			return text;


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
