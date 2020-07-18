var Main = {
	run: function(params) {
		log.setLevel('trace');

		var path = location.pathname;
		Main.isHome = path == '' || path == '/' || path == '/index.html';

		Main.serverUrl();
		if(Main.isHome) {
			Main.statusAjax = $.get(Main.server + 'status');
			Main.sessionToken = Cookies.get('bggg-session');
			Main.tickerNames.parse();
		}
		else{
			Main.OAuthLogin();
		}
	},
	init: function() {
		if(Main.isHome) {
			Main.statusConnection();
			Main.status();
			Main.modalSettings();
			Main.upload();
			Main.loading();
			Main.clickToCopy();
			Main.login();
			Main.loadUserData();
			Main.loginOAuthBtn();
		}
	},
	serverUrl: function() {
		if(location.host == 'localhost:8080')
			Main.server = 'http://localhost:5000/';
		else
			Main.server = 'https://leitordenotas2.herokuapp.com/';
	},
	modalSettings: function() {
		Main.modalRoute('#privacy-modal', 'privacidade-termos');
		// Main.modalRoute('#about-modal', 'sobre');
	},
	modalRoute: function(modalSelector, modalQueryString) {
		var modal = $(modalSelector);
		var modalQS = '?' + modalQueryString;

		function openModal() {
			if(location.search.trim() == modalQS)
				modal.modal('show');
		}
		openModal();
		window.onpopstate = openModal;

		modal.on('show.bs.modal', function() {
			try { history.pushState({}, "", modalQS); }
			catch (e) { location.href = modalQS; }
		});

		modal.on('hide.bs.modal', function() {
			try { history.pushState({}, "", "/"); }
			catch (e) { location.href = '/'; }
		});
	},
	OAuthLogin: function() {
		var qs = location.search.trim();

		if(qs.length <= 1)
			return alert('Error');

		var provider = 'google';
		if(qs.indexOf('state=Facebook') > -1)
			provider = 'facebook';

		$.ajax({
			url: Main.server + 'oauth/' + provider + '/callback' + qs,
			contentType: "application/json",
			type: 'POST'
		}).fail(Main.genericAjaxError).done(function(data){
			Cookies.set('bggg-session', data.session, {path: '/', expires: 14});
			location.href = '/';
		});
	},
	loginOAuthBtn: function() {
		function ajax(event, $t, provider) {
			event.preventDefault();
			$t.html('<img src="/assets/ajax-loader2.gif"> ... carregando');

			$.ajax({
				url: Main.server + 'oauth/' + provider,
				contentType: "application/json",
				type: 'POST'
			}).fail(Main.genericAjaxError).done(function(data){
				location.href = data.url;
			});
		}

		$('#google-login').click(function(e){
			ajax(e, $(this), 'google');
		});

		$('#facebook-login').click(function(e){
			ajax(e, $(this), 'facebook');
		});
	},
	status: function() {
		try {
			var tpl = $(document.getElementById('status-tpl').innerHTML);
			tpl.appendTo('#status');

			Main.statusAjax.done(function(data) {
				tpl.find('#session-qty').text(number_format(data.uniqueSessions, 0, ',', '.'));
				tpl.find('#app-version').text(data.version);
			});

			$.getJSON('/package.json', function(data) {
				tpl.find('#interface-version').text(data.version);
			});
		}
		catch (e) { log.error(e); }
	},
	statusConnection: function() {
		try {
			var tpl = $(document.getElementById('status-connection-tpl').innerHTML);
			var wrapper = tpl.find('#status-connection-wrapper');
			var warning = tpl.find('#status-connection-warning');
			var danger = tpl.find('#status-connection-danger');
			var elem30s = tpl.find('#msg-30s');
			var elem60s = tpl.find('#msg-60s');
			var elem90s = tpl.find('#msg-90s');
			var evtCat = 'Connection Status Notification';

			var msg30s = setTimeout(function() {
				tpl.appendTo('#status-connection');
				wrapper.slideDown();
				Main.GACustomEvent([evtCat, '30 seg', '']);
			}, 30*1000);

			var msg60s = setTimeout(function() {
				elem30s.slideUp(function() {
					elem60s.slideDown();
				});
				Main.GACustomEvent([evtCat, '60 seg', '']);
			}, 60*1000);

			var msg90s = setTimeout(function() {
				elem60s.slideUp(function(){
					elem90s.slideDown();
				});
				Main.GACustomEvent([evtCat, '90 seg', '']);
			}, 90*1000);

			var msg120s = setTimeout(function() {
				warning.slideUp(function() {
					danger.slideDown();
				});
				Main.GACustomEvent([evtCat, '120 seg', '']);
			}, 120*1000);

			Main.statusAjax.always(function() {
				clearTimeout(msg30s);
				clearTimeout(msg60s);
				clearTimeout(msg90s);
				clearTimeout(msg120s);
				wrapper.slideUp();
			});
		}
		catch (e) { log.error(e); }
	},
	GACustomEvent: function(params){
		dataLayer.push({
			event: 'GACustomEvent',
			ga_category: params[0],
			ga_action: params[1],
			ga_label: params[2],
		});
	},
	loadUserData: function() {
		if(!Main.sessionToken)
			return;

		$.ajax({
			url: Main.server + 'pvt/user/me',
			type: 'POST',
			headers: {'x-bggg-session': Main.sessionToken}
		}).fail(function(){
			alert('Não foi possível obter os dados do usuário. Por atualize sua página.');
			Cookies.remove('bggg-session');
		}).done(function(data){
			$('#userInfoWrapper').html( Main.getHtml('userInfo', data) );
			Main.logout();

			if(data.userDoc == null)
				$('#update-user').modal({keyboard: false});
		});

		$('#userUpdateForm').submit(function(e) {
			e.preventDefault();
			var $t = $(this);

			$.ajax({
				url: Main.server + 'pvt/user/me',
				contentType: "application/json",
				data: JSON.stringify({ userDoc: $t.find('#userDoc').val().trim() }),
				headers: {'x-bggg-session': Main.sessionToken},
				type: 'PATCH'
			}).fail(Main.genericAjaxError).done(function(data){
				if(data.error)
					alert(data._messages.join('\n'));
				else
					alert('Dados atualizados com sucesso!');
				location.reload();
			});
		});
	},
	genericAjaxError: function(data){
		alert(data.responseJSON._messages.join('\n'));
		location.href = '/';
	},
	logout: function() {
		$('.logout').click(function(e){
			e.preventDefault();
			Cookies.remove('bggg-session');
			location.reload(true);
		});
	},
	tickerNames:{
		parse: function() {
			if(!Main.sessionToken)
				return;

			$.ajax({
				url: Main.server + 'pvt/tickers-list',
				headers: {'x-bggg-session': Main.sessionToken},
				dataType: 'json'
			})
			.fail(function() {
				alert('Erro ao obter os códigos dos ativos do Banco de Dados, por favor recarregue a página.');
				location.reload(true);
			})
			.done(function(data) {
				var stocks = {};
				var stocksType = {};
				var type, name, code, companyName;
				var items = data.result;
				var item;

				for(var i in items) {
					item = items[i];
					type = item.classe.trim().toUpperCase();
					name = item.nome_pregao.trim().toUpperCase();
					code = item.sigla.trim().toUpperCase();
					companyName = item.razao_social.trim().toUpperCase();
					if(name.length && !stocks[ name ]){
						stocksType[ code ] = type;
						stocks[ name ] = [code, type, companyName];
					}
				}

				Main.tickerNames.stocks = stocks;
				Main.tickerNames.stocksType = stocksType;
			});
		}
	},
	loading: function() {
		var loading = $('#loading');

		$(document).ajaxStart(function(){
			loading.show();
		}).ajaxStop(function() {
			loading.hide();
		});
	},
	secRegex: /^([A-Z0-9]{4}[0-9]{1,2})(F|B)?/,
	secRegex2: /([A-Z0-9]{4}[1-9]{1,2})(F|B)?/,
	fRegex: /F$/,
	opcaoRegex: /([a-z0-9]+).*/i,
	uploadCallback: function() {
		try{
			Main._uploadCallback.apply(this, arguments);
		}
		catch(e) {
			Main.error(e);
		}
	},
	_uploadCallback: function(e, data){
		var base = $('#print-structure-base');
		var wrapper = $('#output-wrapper');
		var errorsLog = [];

		if(data.result._error){
			errorsLog.push(data.result);
			Main.displayError(errorsLog);
			return;
		}

		var note, myWrapper, sec, temp, s, st;
		var stockType = {' ON': 3, ' UNT': 11, ' PNA': 5, ' PNB': 6, ' PNC': 7, ' PND': 8, ' PNE': 11, ' PNF': 12, ' PNG': 12, ' PN': 4};
		for(var i in data.result){
			note = data.result[i];

			if(note._error){
				errorsLog.push(note);
				note.errorsLog = true;
			}
			if( !(note._noteReadCompletely && note.trades && note.trades.length) )
				continue;

			myWrapper = base.children().clone().appendTo(wrapper);

			// Criando variável para inserir erros de "front"
			note._error = note._error || false;
			note._messages = note._messages || [];

			// Trocando o nome das empresas por suas siglas (quando houver)
			for(var t in note.trades){
				sec = note.trades[t].securities.toUpperCase();

				// Ignoro qualquer tratativa caso seja uma OPÇÃO
				if(note.trades[t].marketType.indexOf('OPC') > -1 || note.trades[t].marketType.indexOf('OPV') > -1){
					note.trades[t].originalSecurities = note.trades[t].securities;
					note.trades[t].securities = note.trades[t].securities.replace(Main.opcaoRegex, '$1');
					continue;
				}
				else if(note.type == "BMF")
					continue;
				// Convertendo o nome dos papeis
				else if(note.bConf == 'Rico'){
					temp = null;

					for(s in Main.tickerNames.stocks){
						if(sec.indexOf(s) == 0){ // Buscando pelo nome do pregão
							temp = Main.tickerNames.stocks[s][0];
							log.info('🔎 Encontrei ❝' + sec + '❞ (' + temp + ') buscando pelo nome do pregão');
							break;
						}
						else if(sec.indexOf( Main.tickerNames.stocks[s][2].substring(0, 12) ) == 0){ // buscando pela razão social
							temp = Main.tickerNames.stocks[s];
							if(temp[1] == 'AÇÃO'){
								for(st in stockType){
									if(sec.indexOf(st) > 0){
										temp = temp[0].substring(0, 4) + stockType[st];
										log.info('🔍 Encontrei ❝' + sec + '❞ (' + temp + ') buscando pela razão social');
										break;
									}
								}
								break;
							}
							else
								temp = null;
						}
					}

					if(temp){
						log.info('🔄 ❝' + sec + '❞ será convertido para ❝' + temp + '❞');
						note.trades[t].originalSecurities = note.trades[t].securities;
						note.trades[t].securities = temp;
					}
					else{
						note._error = true;
						note._messages.push('✖️ Ativo não convertido: ❝' + note.trades[t].securities + '❞');
					}
				}
				// Pegando o código do papel no caso das corretoras que trazem
				else{
					if(note.bConf == 'Easynvest')
						temp = sec.match(Main.secRegex2);
					else
						temp = sec.replace(/\s/g, '').match(Main.secRegex);

					if(temp){
						note.trades[t].originalSecurities = note.trades[t].securities;
						note.trades[t].securities = temp[1].trim().replace(Main.fRegex, '');
					}
					else
						note.trades[t].securities = sec;
				}

				// Adicionando o tipo do ativo
				note.trades[t].type =  Main.tickerNames.stocksType[ note.trades[t].securities ] || '';
			}

			// Dados da nota
			myWrapper.find('.note-data tbody').html( Main.getHtml('brokerageNote', note) );

			// Resumo Financeiro
			myWrapper.find('.financial-summary tbody').html( Main.getHtml('tax', note) );

			// Lista de títulos / papéis
			myWrapper.find('.trades tbody').html( Main.getHtml('trades', note) );

			// Marcando em vermelho as notas que não baterem a prova real
			if(!note.proofIsValid)
				myWrapper.addClass('bg-danger text-white');

			// Gerando os textos para serem copiados
			Main.dataToText(note);

			// Marcando os arquivos carregados com sucesso
			$('#status-wrapper').find('span[data-name="' + note.fileName + '"]').addClass('badge-success').removeClass('badge-secondary');

			// Verificando se foi informado algum erro de front
			if(note._error && !note.errorsLog)
				errorsLog.push(note);
		}

		Main.displayError(errorsLog);
		wrapper.slideDown();
	},
	displayError: function(errorsLog) {
		// Exibindo o log do erros
		if(errorsLog.length)
			$('#errors-log').slideDown().append( Main.getHtml('errorsLog', {items: errorsLog}) );
	},
	dataToText: function(note) {
		var wrapper = $('#to-copy-wrapper');

		// Preparando a lista de negócios realizados
		var textTrades = [];
		var tradesVol = 0;
		for(var t in note.trades){
			trade = note.trades[t];
			textTrades.push($.extend({}, trade, {
				// 'securities':        trade.securities
				'date':             note.date
				,'operationType':    trade.obs
				// ,'operationType':    trade.obs == 'D'? 'DT': trade.obs
				,'quantity':         trade.quantity * (trade.BS == 'C'? 1: -1)
				// ,'price':            trade.price
				,'tax':              ''
				,'brokerage':        note.broker
				,'IRPF':             ''
				,'noteNumber':       note.number
				// ,'marketType':       trade.marketType
			}));

			tradesVol += trade.itemTotal;
		}

		// Agrupando os negócios pelo ativo e tipo de operação para simplificar as linhas na planilha
		var tradesGrouped = {};
		var TT, TGId;
		for(var i = 0; i < textTrades.length; i++){
			TT = textTrades[i];
			TGId = TT.marketType + TT.BS + TT.securities + TT.price + TT.obs;
			// log.info({ TGId: TGId, textTrade: TT });

			tradesGrouped[TGId] = tradesGrouped[TGId] || {
				itemTotal: 0,
				securities: TT.securities, // Cód. do Ativo
				date: TT.date, // Data da Transação
				operationType: Main.operationType(TT), // Tipo de Operação
				quantity: 0, // Quantidade
				price: TT.price, // Preço/ Ajuste
				brokerage: TT.brokerage // Corretora
			};

			tradesGrouped[TGId].quantity += TT.quantity;
			tradesGrouped[TGId].itemTotal += TT.itemTotal;
		}

		// Dividindo a taxa da nota proporcionalmente aos ativos agrupados
		var TG, tgFirst;
		var c = 0;
		var taxVol = 0;
		var noteTax = note.allFees + (note.ISSTax < 0? note.ISSTax: 0);

		noteTax = Math.abs(noteTax);
		for(var g in tradesGrouped){
			c++;
			// ignoro o cálculo da taxa para o primeiro item
			if(c == 1){
				tgFirst = g;
				continue;
			}

			TG = tradesGrouped[g];
			TG.tax = Math.round( (TG.itemTotal * noteTax / tradesVol) * 100 ) / 100;
			taxVol += TG.tax;
		}
		log.info({ 'Custo total da nota': noteTax, 'Custo dos itens somados, exceto o 1º': taxVol });
		tradesGrouped[tgFirst].tax = Math.round( (noteTax - taxVol) * 100 ) / 100;

		// Colocando dos dados da nota no primeiro item negociado
		$.extend(textTrades[0], note, {trades: null, fullText: null, IR: (note.IRRF < 0? note.IRRF: '')});
		$.extend(tradesGrouped[tgFirst], note, {trades: null, fullText: null, IR: (note.IRRF < 0? note.IRRF*-1: null)});

		// Populando a caixa de texto para compartilhar para a planilha dlombello
		var textDlombello = wrapper.find('.text-to-dlombello');
		textDlombello.val( Main.sortExportDlombello(
			textDlombello.val() +
			'\n' +
			Main.getHtml('textToDlombello', {textTrades: tradesGrouped}).trim()
		) );

		// Populando a caixa de texto para copiar para Excel
		var textExcel = wrapper.find('.text-to-excel');
		textExcel.val( (
			textExcel.val() +
			'\n' +
			Main.getHtml('textToExcel', {textTrades: textTrades}).trim()
		).trim() );

		wrapper.slideDown();
	},
	operationType: function(trade) {
		if(['D', 'D#', 'D#2', 'DAY TRADE', 'HD'].indexOf(trade.obs) > -1)
			return 'DT';
		else if (['AJUPOS'].indexOf(trade.obs) > -1)
			return 'AJ.POS';

		return trade.BS;
	},
	sortExportDlombello: function(txt) {
		var list = txt.trim().split("\n");
		list.sort(function(lineA , lineB){
			lineA = Main.generateSortStr(lineA);
			lineB = Main.generateSortStr(lineB);

			if (lineA < lineB) // a é menor que b em algum critério de ordenação
				return -1;
			else if (lineA > lineB) // a é maior que b em algum critério de ordenação
				return 1;

			return 0; // a deve ser igual a b
		});

		return list.join("\n").trim();
	},
	generateSortStr: function(strLine) {
		var out;
		var list = strLine.split("\t");
		var qtyStr = Main.forceNumberSize(list[3]);
		out = list[1].split('/').reverse().join(''); // data
		out += list[6]; // corretora
		out += (list[3].indexOf('-') > -1? '-': '+') + qtyStr; // quantidade
		out += Main.forceNumberSize(list[4]); // preço
		return out.toUpperCase();
	},
	forceNumberSizeRegex: /[^0-9]+/g,
	forceNumberSize: function(numberStr) {
		numberStr = numberStr.toString().replace(Main.forceNumberSizeRegex, '');
		return ('0000000000' + numberStr).slice(-10);
	},
	getHtml: function(id, content){
		var source   = document.getElementById(id).innerHTML;
		var template = Handlebars.compile(source);
		return template(content);
	},
	addFilesToStatus: function(fileName) {
		$('#status-wrapper').slideDown().append( Main.getHtml('file', {fileName: fileName}) );
	},
	upload: function(){
		$('#fileupload').fileupload({
			dataType: 'json',
			url: Main.server + 'pvt/upload',
			headers: {'x-bggg-session': Main.sessionToken},
			add: function (e, data) {
				Main.addFilesToStatus( data.files[0].name );

				data.submit();
			},
			done: Main.uploadCallback
		});
	},
	clickToCopy: function() {
		// Copiar o texto
		$('.click-to-copy button').off('click').click(function() {
			$(this).closest('.click-to-copy').find('textarea')[0].select();
			document.execCommand('copy', false, null);
		});
	},
	login: function() {
		var wrapper = $('#login');

		if(Cookies.get('bggg-session'))
			$(document.body).addClass('logged');
		else
			wrapper.slideDown();

		wrapper.find('#emailForm').submit(function(e) {
			e.preventDefault();

			$.ajax({
				url: Main.server + 'login',
				contentType: "application/json",
				data: JSON.stringify({ email: wrapper.find('#email').val().trim() }),
				type: 'POST'
			}).fail(function(){
				alert('Houve um problema ao tentar enviar sua mensagem. Por favor tente novamente.');
				location.reload();
			}).done(function(data){
				Main.sessionTokenTemp = data.session;

				wrapper.find('#emailMsg').slideUp();
				wrapper.find('#tokenForm').slideDown().find('input#token').focus();
			});

			$(this).slideUp();
			wrapper.find('#emailMsg').slideDown();
		});

		wrapper.find('#tokenForm').submit(function(e) {
			e.preventDefault();

			$.ajax({
				url: Main.server + 'token',
				data: JSON.stringify({ token: wrapper.find('#token').val().trim() }),
				type: 'POST',
				contentType: "application/json",
				headers: {'x-bggg-session': Main.sessionTokenTemp}
			}).fail(function(){
				alert('Não foi possível validar o seu TOKEN. Por favor tente novamente.');
				location.reload();
			}).done(function(){
				Cookies.set('bggg-session', Main.sessionTokenTemp, {path: '/', expires: 14});
				Main.sessionToken = Main.sessionTokenTemp;

				$('#tokenMsg').slideDown(function() {
					setTimeout(function(){
						wrapper.slideUp();
						$(document.body).addClass('logged');
						location.reload(); // Solução temporária pois o plugin de upload nao reconhece o cookie após ele ter sido chamado
					}, 1000);
				});
			});

			$(this).slideUp();
		});
	},
	error: function(err) {
		alert('Desculpe, ocorreu um erro inesperado. Por favor atualize a página.');
		console.error(err);
	}
};

Main.run();
$(Main.init);

// PHP's number_format in JavaScript - http://locutus.io/php/strings/number_format/
function number_format(b,c,d,e){b=(b+"").replace(/[^0-9+\-Ee.]/g,"");b=isFinite(+b)?+b:0;c=isFinite(+c)?Math.abs(c):0;e="undefined"===typeof e?",":e;d="undefined"===typeof d?".":d;var a="",a=function(a,b){var c=Math.pow(10,b);return""+(Math.round(a*c)/c).toFixed(b)},a=(c?a(b,c):""+Math.round(b)).split(".");3<a[0].length&&(a[0]=a[0].replace(/\B(?=(?:\d{3})+(?!\d))/g,e));(a[1]||"").length<c&&(a[1]=a[1]||"",a[1]+=Array(c-a[1].length+1).join("0"));return a.join(d)}; // jshint ignore:line

if(typeof Handlebars != 'undefined') {
	Handlebars.registerHelper('numberFormatBr', function (value) {
		return typeof value == 'undefined'? '': number_format(value, 2, ',', '.');
	});
	Handlebars.registerHelper('numberFormatBr0', function (value) {
		return typeof value == 'undefined'? '': number_format(value, 0, ',', '.');
	});
}