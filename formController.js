/**
 * FormController.js
 * For Bootstrap 4 & Others
 * Author: Tisserand David
 * v1.2 2020-10-04
 */



function FormController(item, options) {

	if (!item.length) {
		console.log('Empty item');
		return false;
	}

	this.item = item;

	var options = options || [];
	/* Default Config */
	var defaults = {
		blurControl: false,
		runningControl: false,
		showIsValid: false,
		autoScroll: true,
		scrollDuration: 400,
		marginTop: 40,
		quitPrevent: false,
		stepByStep: false,
		nextStepAnimation: false,
		nextStepCallback : false,
		customControl: false,
		errorCallback : false,
		progressTracking: false,
		trackingOnlyRequired: false,
		submitCallback: false,
		ajaxSubmit: false,
	};

	/* Construct */
	this.options = $.extend({}, defaults, options);
	validationSuccess = false;


	// Disable submit button
	if (item.find('[type=submit]').length) {
		item.find('[type=submit]').each(function(){
			$(this).addClass('btn-submit');
			$(this).attr('type', 'button');			
		});		
	} else {
		console.log('FormController : Any submit button detected');
	}



	// Progress Tracking
	if (this.options.progressTracking) {
		var that = this;
		// Init
		var names = [];
		that.item.find('input[type=radio],input[type=checkbox]').each(function() {
			var name = $(this).attr('name');
			if (names.indexOf(name) < 0) {
				if (that.target.find('input[name='+name+']').eq(0).parent().prop('tagName') == 'label') {
					$('<input type="hidden" name="'+name+'" value="" />').insertBefore(that.item.find('input[name='+name+']').eq(0));
				} else {
					$('<input type="hidden" name="'+name+'" value="" />').insertBefore(that.item.find('input[name='+name+']').eq(0).parent());
				}
				names.push(name);
			}

		});
		that.item.find('input,textarea,select').blur(function(){
			if (that.options.trackingOnlyRequired) {
				console.log('Only required');
				var data = that.item.find('select[required], textarea[required], input[required]').serialize();
			} else {
				var data = that.item.serialize();
			}
			$.ajax({
				url: that.options.progressTracking,
				method: 'POST',
				data: data
			}).done(function(r){
			}).fail(function(){
				console.log('FormController: Tracking ERROR');
			});
		});
	}

	/* QuitPrevent */
	if (this.options.quitPrevent) {
		this.submitted = false;
		var originalValues = [];
		inputs = this.item.find('input,select,textarea');
		var that = this;
		inputs.each(function(){
			originalValues.push($(this).val());
		});

		var that = this;
		window.onbeforeunload = function (e) {
			var e = e || window.event;
			if (that.confirmExit(originalValues)) {
				// For IE and Firefox
				if (e) {
					e.returnValue = "Votre saisie n'est pas enregistrée!...";
				}
				// For Safari
				return "Votre saisie n'est pas enregistrée!...";
			}
		}
	}

	// Blur Control
	if (this.options.blurControl) {
		var that = this;
		this.item.find('input[type=radio]').on('change', function(){
			inputName = $(this).attr('name');
			var radios = this.item.find('input[name='+inputName+']');
			radios.each(function(){
				that.control($(this));
			});
		});
		that.item.find('input,textarea,select').blur(function(){
			that.control($(this));
		});
	}

	//Running Control
	if (this.options.runningControl) {
		var that = this;
		this.item.find('input,textarea').keyup(function(){
			that.control($(this));
		});
	}

	// Step By Step Control
	if (this.options.stepByStep) {
		var that = this;
		that.target.find('.next-step').click(function(){
			validationSuccess = true;
			var step = $(this).parents('.step').data('step');
			that.item.find('.step[data-step='+step+'] input, .step[data-step='+step+'] textarea, .step[data-step='+step+'] select').each(function(i){
				that.control($(this));
			});
			if (that.options.customControl) {
				validationSuccess = validationSuccess && that.options.customControl();
			}
			that.validation(step);
			if (that.options.nextStepCallback) {
				that.options.nextStepCallback();
			}
		});
		that.item.find('.prev-step').click(function(){
			var step = $(this).parents('.step').data('step');
			if (that.options.nextStepAnimation) {
				that.options.nextStepAnimation();					
			} else {
				that.item.find('.step[data-step='+step+']').hide();
				that.item.find('.step[data-step='+(step-1)+']').show();
			}
		});
	}

	// On submit Control
	var that = this;
	that.item.find('.btn-submit').click(function(){

		$(this).attr('disabled', true);

		validationSuccess = true;

		that.item.find('input, textarea, select').each(function(){
			that.control($(this));
		});
		
		if ($.active > 0) {
			$( document ).ajaxComplete(function(){
				if (that.options.customControl) {
					validationSuccess = validationSuccess && that.options.customControl();
				}
				that.validation();
			});
		} else {
			if (that.options.customControl) {
				validationSuccess = validationSuccess && that.options.customControl();
			}
			that.validation();
		}
	});
	// Enter Press
	that.item.find('input, textarea').keyup(function(e){

		var key = e.which;
		if(key == 13)  // the enter key code
		{
			that.item.find('.btn-submit').attr('disabled', true);

			validationSuccess = true;

			that.item.find('input, textarea, select').each(function(){
				that.control($(this));
			});
			
			if ($.active > 0) {
				$( document ).ajaxComplete(function(){
					if (that.options.customControl) {
						validationSuccess = validationSuccess && that.options.customControl();
					}
					that.validation();
				});
			} else {
				if (that.options.customControl) {
					validationSuccess = validationSuccess && that.options.customControl();
				}
				that.validation();
			}

		}  
	});
}

FormController.prototype.confirmExit = function(originalValues) {
	newValues = [];
	inputs = this.item.find('input, select, textarea');
	inputs.each(function(){
		newValues.push($(this).val());
	});
	changed = false;

	for (var i = 0; i < originalValues.length; i++) {
		if (originalValues[i] != newValues[i]) changed=true;
	}
	return changed && !this.submitted;
}

FormController.prototype.validation = function(step) {
	var that = this;
	var step = step || false;
	if (validationSuccess) {
		if (step && this.item.find('.step[data-step='+(step+1)+']').length) {
			if (this.options.nextStepAnimation) {
				this.options.nextStepAnimation();					
			} else {
				this.item.find('.step[data-step='+step+']').hide();
				this.item.find('.step[data-step='+(step+1)+']').show();
				var top = this.item.find('.step[data-step='+(step+1)+']').offset().top;
				$('html, body').animate({
			        scrollTop: top-this.options.marginTop
			    }, this.options.scrollDuration);
			}
		} else {
			this.submitted = true;
			if (this.options.ajaxSubmit) {
				var data = this.item.serialize();
				this.item.find('.btn-submit').attr('disabled', true);
				this.item.css('opacity', '0.3');
				$.ajax({
					url: this.item.attr('action'),
					method: 'POST',
					data: data
				}).done(function(r){
					that.item.css('opacity', '1');
					that.item.find('.btn-submit').attr('disabled', false);
					if (that.options.submitCallback) {
						that.options.submitCallback(r, that.item);
					}
				}).fail(function(){
					console.log('FormController: SUBMIT ERROR');
				});
			} else {
				this.item.submit();
			}
		}
	} else {
		if (this.options.autoScroll) {
			if (this.item.find('.is-invalid').length) {
				var first = this.item.find('.is-invalid').eq(0);
				if (!first.is(':visible')) {
					first.show();
					var top = first.offset().top;
					first.hide();						
				} else {
					var top = first.offset().top;
				}
				$('html, body').animate({
			        scrollTop: top-this.options.marginTop
			    }, this.options.scrollDuration);
			}
		}
		if (this.options.errorCallback) {
			this.options.errorCallback();
		}
		that.item.find('.btn-submit').attr('disabled', false);
	}
}

FormController.prototype.display = function(input, inputError) {
	var inputName = input.attr('name');
	if (inputName != undefined) {
		inputName = inputName.replace('[]', '');
		
		if (inputName!= '' && this.item.find('input[data-control-verifpassword='+inputName+']').length) {
			var value = input.val();
			if (value != this.item.find('input[data-control-verifpassword='+inputName+']').val()) {
				this.item.find('input[data-control-verifpassword='+inputName+']').addClass('is-invalid');
			} else {
				this.item.find('input[data-control-verifpassword='+inputName+']').removeClass('is-invalid');
				if (this.options.showIsValid) {
					this.item.find('input[data-control-verifpassword='+inputName+']').addClass('is-valid');
				}
			}
		}
	}

	if (inputError) {
		input.addClass('is-invalid');
		validationSuccess = false;
	} else {
		input.removeClass('is-invalid');
		if (this.options.showIsValid && input.prop('required') && input.val()!='') {
			input.addClass('is-valid');
		}
	}
}

FormController.prototype.control = function(input) {

	// On ignore les champs invisibles
	if (!input.is(':visible')) {
		this.display(input, false);
		return true;
	}
	// Si le champs est de type radio
	if (input.attr('type')=='radio') {
		var value = this.item.find('input[name='+input.attr('name')+']:checked').val();
	} else if (input.attr('type')=="checkbox") {
		inputError = input.prop('required') && !input.prop("checked");
		this.display(input, inputError);
		return true;
	} else {
		var value = input.val();			
	}
	var inputError = false;


	// Si le champs est requis et n'est pas vide
	if (input.prop('required') && ((Array.isArray(value) && !value.length) || value ==  undefined || (typeof value == 'string' && (value == '' || value.replace(/ /g, "") == '')))) {
		inputError = true;				
		this.display(input, inputError);
	} else if (input.prop('required') || value != '') {
		var that = this;
		Object.keys(input.data()).map(function(objectKey, index) {

		    var expected = input.data()[objectKey];

		    if (objectKey.match(/^control/)) {
		    	var control = objectKey.replace('control', '').toLowerCase();
				switch(control) {
					case 'minlength':
						inputError = value.length<expected;
						break;
					case 'maxlength':
						inputError = value.length>expected;
						break;
					case 'length':
						var min = expected.split('-', 2)[0];
						var max = expected.split('-', 2)[1];
						inputError = value.length<min || value.length>max;
						break;
					case 'email':
						inputError = !value.match(/^[a-z0-9_\.-]+\@[a-z0-9_\.-]+\.[a-z]{2,4}$/i);
						break;
					case 'url':
						inputError = !value.match(/^(http(s)?:\/\/(www\.)?)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i);
						break;
					case 'pattern':
						var flags = expected.replace(/.*\/([gimy]*)$/, '$1');
						var pattern = expected.replace(new RegExp('^/(.*?)/'+flags+'$'), '$1');
						var regex = new RegExp(pattern, flags);
						inputError = !value.match(pattern, flags);
						break;
					case 'verifpassword':
						var verifPassword = $(that.target+' input[name='+expected+']').val();
						if (that.options.runningControl) {
							$(that.target+' input[name='+expected+']').keyup(function(){
								if($(that).val()!=$(that.target+' input[data-control-verifpassword]').val()){
									$(that.target+' input[data-control-verifpassword]').addClass('is-invalid');
								} else {
									$(that.target+' input[data-control-verifpassword]').removeClass('is-invalid');
									if (that.options.showIsValid) {
										$(that.target+' input[data-control-verifpassword]').addClass('is-valid');
									}
								}
							});
						}
						inputError = value != verifPassword;
						break;
					case 'duplicate':
						var originalValue = input.prop("defaultValue");

						if (value != originalValue) {
							$.ajax({
								url: expected,
								method: 'POST',
								data: {value: value, ajax:true}
							}).done(function(r){
								inputError = r.exists;
								that.display(input, inputError);
							});							
						} else {
							inputError = false;
						}
						break;
					case 'exist':
						var originalValue = input.prop("defaultValue");

						if (value != originalValue) {
							$.ajax({
								url: expected,
								method: 'POST',
								data: {value: value}
							}).done(function(r){
								inputError = !r.exist;
								that.display(input, inputError);
							});							
						} else {
							inputError = false;
						}
						break;
					default:
						break;
				}
			}
			
		});
		this.display(input, inputError);
	} else {
		inputError = false;
		this.display(input, inputError);
	}
	return true;
}
$.fn.formController = function(options) {
	return this.each(function() {
		new FormController($(this),options);
	});
};
$.fn.formController.Constructor = FormController;
