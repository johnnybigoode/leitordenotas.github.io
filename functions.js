var jsAlert = function (text, callback, options) {
	var opts = $.extend(true, {
		content: text.replace('\n', '<br>'),
		title: null,
		onClose: callback || function () {},
		columnClass: 'col-md-4 col-md-offset-4 col-xs-10 col-xs-offset-1'
	}, options || {});
	$.alert(opts);
};
var jsAlertSuccess = function (text, callback) { jsAlert(text, callback || function () {}, { title: '✔ Sucesso', type: 'green' }); };
var jsAlertError = function (text, callback) { jsAlert(text, callback || function () {}, { title: '❌ Erro', type: 'red' }); };

var Ajax = function (urlPath, sendDataJSON, requestType, disableFailCallback) {
	var req = $.ajax({
		url: Main.server + urlPath,
		contentType: "application/json",
		data: sendDataJSON ? JSON.stringify(sendDataJSON) : null,
		headers: { 'x-bggg-session': Main.sessionToken },
		type: requestType ? requestType : 'POST'
	});

	if (!disableFailCallback)
		req.fail(function (data) {
			if (data.responseJSON && data.responseJSON._messages)
				jsAlertError(data.responseJSON._messages.join('\n'), function () { location.href = '/'; });
			else
				jsAlertError('❌ Erro inesperado!', function () { location.href = '/'; });
		});

	return req;
};

var Main = {
	run: function(params) {
		log.setLevel('trace');

		var path = location.pathname;
		Main.isHome = path == '' || path == '/' || path == '/index.html';

		Main.serverUrl();
		if(Main.isHome) {
			Main.statusAjax = $.get(Main.server + 'status');
			Main.sessionToken = Cookies.get('bggg-session');
		}
		else{
			Main.OAuthLogin();
		}
	},
	init: function() {
		$(document).ajaxStart(function() { $(".loading").show(); }).ajaxStop(function() { $(".loading").hide(); });

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
	modal: function (tpl, small) {
		if (Main.modal_)
			return Main.modal_.show(tpl, small);

		var m = {modal: $('#standard-modal')};
		m.title = m.modal.find('.modal-header h5');
		m.body = m.modal.find('.modal-body');
		m.dialog = m.modal.find('.modal-dialog');

		m.modal.on('hidden.bs.modal', function () {
			m.title.empty();
			m.body.empty();
		});

		m.show = function (tpl, small) {
			if(small)
				m.dialog.removeClass('modal-lg');
			else
				m.dialog.addClass('modal-lg');
			tpl.filter('span').appendTo(m.title.empty());
			tpl.filter('div').appendTo(m.body.empty());
			m.modal.modal();
		};

		Main.modal_ = m;
		return Main.modal_.show(tpl, small);
	},
	serverUrl: function() {
		if(location.host == 'localhost:8080')
			Main.server = 'http://localhost:5000/';
		else
			Main.server = 'https://leitordenotas2.herokuapp.com/';
	},
	accountModal: function () {
		if (Main._am)
			return Main.modal(Main._am);

		Main._loadUserData.done(function (data) {
			Main._am = $(Main.getHtml('account-tpl', data));

			// Transações do usário
			var trans = Main._am.find('.user-transactions');
			trans.html('<img src="/assets/ajax-loader2.gif">');
			Ajax('pvt/user/transactions').done(function (data) {
				trans.html(Main.getHtml('user-transactions-tpl', data));
			});

			// Hitórico de uso
			var hist = Main._am.find('.usage-history');
			hist.html('<img src="/assets/ajax-loader2.gif">');
			Ajax('pvt/user/usage-history').done(function (data) {
				hist.html(Main.getHtml('usage-history-tpl', data));
			});

			Main.modal(Main._am);
		});
	},
	showConnectTransaction: function (btn) {
		var link = $(btn).hide();
		link.next('').show();
	},
	connectTransaction: function (btn) {
		var link = $(btn).parent().hide();
		var form = link.next('').show();

		form.off('submit').submit(function (e) {
			e.preventDefault();
			form.slideUp();

			Ajax('pvt/user/connect-transaction', { code: form.find('#connectCode').val() }).done(function (data) {
				if(data.success)
					jsAlertSuccess('A transação foi associada com o seu email.', function () { location.reload(); });
				else
					jsAlertError('Essa transação não pôde ser associada a sua conta.', function () { location.reload(); });
			});
		});
	},
	userAccountDelete: function (link) {
		jsAlert('Você deseja mesmo EXCLUIR esta conta?', function () {}, {
			title: 'Atenção',
			buttons: {
				Excluir: {
					btnClass: 'btn-red',
					action: function () {
						$(link).hide();
						Ajax('pvt/user/delete', null, 'DELETE').done(function (data) {
							Cookies.remove('bggg-session');
							jsAlertSuccess('Sua conta foi excluída.', function () { location.reload(); });
						});
					}
				},
				Cancelar: {}
			}
		});
	},
	newEmailModal: function () {
		if (!Main._nem)
			Main._nem = $(document.getElementById('tpl-new-email-modal').innerHTML);

		var loading = $('<div><img src="/assets/ajax-loader2.gif"> ... carregando</div>');
		var sendToken = false;
		Main._nem.find('form').off('submit').submit(function(e){
			e.preventDefault();
			var form = $(this);
			var inputs = form.find('input, button');
			form.append(loading);
			inputs.prop('disabled', true);

			if(sendToken){
				loading.show();
				Ajax('pvt/user/new-email-token', {
					newEmailToken: form.find('[name=newEmailToken]').val().trim()
				}).done(function (data) {
					Cookies.remove('bggg-session');
					jsAlertSuccess('Seu email foi alterado. \n A página será recarregada e você deverá se autenticar novamente.', function () { location.reload(); });
					loading.hide();
				});
			}
			else{
				var emailInput = form.find('[name=newEmail]');
				Ajax('pvt/user/new-email', {
					newEmail: emailInput.val().trim()
				}).done(function (data) {
					form.find('.new-email-FG').slideUp();
					form.find('.new-email-token-FG').slideDown();
					inputs.not(emailInput).removeAttr('disabled');
					loading.hide();
					sendToken = true;
				});
			}
		});

		Main.modal(Main._nem);
	},
	managerMembersModal: function () {
		if (!Main._mmm)
			Main._mmm = $(document.getElementById('tpl-manage-members-modal').innerHTML);

		Main.listMembers();

		var loading = $('<div><img src="/assets/ajax-loader2.gif"> ... carregando</div>');
		Main._mmm.find('form').off('submit').submit(function (e) {
			e.preventDefault();
			var form = $(this);
			var inputs = form.find('input, button');
			form.append(loading);
			inputs.prop('disabled', true);
			loading.show();

			Ajax('pvt/user/add-member-document', { memberDoc: form.find('[name=memberDoc]').val().trim() }).done(function (data) {
				jsAlertSuccess('Membro adicionado');
				loading.hide();
				inputs.removeAttr('disabled');
				form[0].reset();
				Main.listMembers();
			});
		});

		Main.modal(Main._mmm);
	},
	listMembers: function () {
		Ajax('pvt/user/list-members').done(function (data) {
			$('.members-list').html(' - ' + data.members.join('<br> - '));
		});
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
			return jsAlertError('Error');

		var provider = 'google';
		if(qs.indexOf('state=Facebook') > -1)
			provider = 'facebook';
		else if(qs.indexOf('state=microsoft') > -1)
			provider = 'microsoft';

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

		$('#microsoft-login').click(function(e){
			ajax(e, $(this), 'microsoft');
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

		Main._loadUserData = Ajax('pvt/user/me', null, null, true).fail(function(){
			Cookies.remove('bggg-session');
			jsAlertError('Não foi possível obter os dados do usuário. \n Por atualize sua página.', function () { location.reload(); });
		}).done(function(data){
			$('#userInfoWrapper').html( Main.getHtml('userInfo', data) );
			Main.logout();

			if(data.userDoc == null)
				Main.updateUserModal();
		});
	},
	updateUserModal: function () {
		if (!Main._uum)
			Main._uum = $(document.getElementById('userDocRequestTpl').innerHTML);

		Main._uum.find('#userUpdateForm').off('submit').submit(function (e) {
			e.preventDefault();
			var $t = $(this);

			Ajax('pvt/user/me', { userDoc: $t.find('#userDoc').val().trim() }, 'PATCH').done(function (data) {
				if (data.error)
					jsAlertError(data._messages.join('\n'), function () { location.reload(); });
				else
					jsAlertSuccess('Dados atualizados com sucesso!', function () { location.reload(); });
			});
		});

		Main.modal(Main._uum, true);
	},
	logout: function() {
		$('.logout').click(function(e){
			e.preventDefault();
			Cookies.remove('bggg-session');
			location.reload(true);
		});
	},
	loading: function() {
		var loading = $('#loading');

		$(document).ajaxStart(function(){
			loading.show();
		}).ajaxStop(function() {
			loading.hide();
		});
	},
	uploadCallback: function(data){
		var base = $('#print-structure-base');
		var wrapper = $('#output-wrapper');
		var errorsLog = [];

		if(data._error){
			errorsLog.push(data);
			Main.displayError(errorsLog);
			return;
		}

		var note, myWrapper;
		for(var i in data){
			note = data[i];

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
	operationType: function (trade) {
		var out = trade.BS;
		if (trade.isDayTrade)
			out = 'DT';
		else if ('AJUPOS' == trade.obs)
			out = 'AJ.POS';

		if (trade.isCallOptionExec)
			out = 'EX.OPC';
		else if (trade.isCallOptionExec)
			out = 'EX.OPV';

		return out;
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
		var fileWrapper = $(Main.getHtml('file', {fileName: fileName}));
		$('#status-wrapper').slideDown().append(fileWrapper);
		return fileWrapper;
	},
	upload: function () {
		$('#fileupload').fileupload({
			dataType: 'json',
			url: Main.server + 'pvt/upload',
			headers: { 'x-bggg-session': Main.sessionToken },
			add: function (e, data) {
				var fileTag = Main.addFilesToStatus(data.files[0].name);
				data.submit().done(function (data) {
					try {
						Main.uploadCallback(data);
						fileTag.addClass('badge-success').removeClass('badge-secondary');
					} catch (e) {
						Main.error(e);
						fileTag.addClass('badge-danger').removeClass('badge-secondary');
					}
				}).fail(function () {
					fileTag.addClass('badge-danger').removeClass('badge-secondary');
				});
			}
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
				jsAlertError('Houve um problema ao tentar enviar sua mensagem. \n Por favor tente novamente.', function () { location.reload(); });
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
				jsAlertError('Não foi possível validar o seu TOKEN. \n Por favor tente novamente.', function () { location.reload(); });
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
		if(console && console.error)
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