var App = {
    button: 'toolButton',
    icons_stylesheet: 'https://cdn.materialdesignicons.com/4.5.95/css/materialdesignicons.min.css',
    func: 'none',
    sinfo: {},
    tools: {
        capitalize: function(string) {
            string = string.toLowerCase();
            string = string.split(' ');
            var news = [];
            string.forEach(function(i) {
                news.push(i[0].toUpperCase() + i.slice(1));
            });
            return news.join(' ');
        },
        group: function(array, prop) {
            var result = {};
            for (var i = 0; i < array.length; i++) {
                var key = array[i][prop];
                if (!result[key]) {
                    result[key] = [];
                }
                result[key].push(array[i]);
            }
            return result;
        },
        getPath: function() {
            var path = (window.location.pathname).split('/');
            path.splice(0, 2);
            return path;
        },
        ajaxReq: function(path, data, onSuccess, onFail, errorMsg) {
            var req = new XMLHttpRequest(),
                reqResp;

            req.open('post', 'https://sega.uach.mx/sega-rest/alumno/' + App.sinfo.sid + '/' + path + '/JSON', true);
            req.onload = function() {
                if (req.status == 200) {
                    reqResp = JSON.parse(req.responseText);
                    return onSuccess(reqResp);
                } else {
                    onFail();
                    alert(errorMsg);
                    return false;
                }
            };
            req.onerror = function(err) {
                alert(errorMsg);
                console.error(err);
                return false;
            };
            req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
            req.send(data.label + '=' + data.value);
        }
    },
    bindInfo: function() {
        if (typeof App.sinfo.sid === 'undefined') {
            var careers = document.querySelectorAll('.tbMuestraCarrerasGris');

            if (careers.length === 1) {
                App.sinfo.sid = document.getElementsByClassName('tdAlumnoMatricula')[0].innerText;
                App.sinfo.sname = App.tools.capitalize(document.getElementsByClassName('tdAlumnoNombre')[0].innerText);
                App.sinfo.sreg = document.getElementById('tbMuestraCarrera1').getAttribute('idinscripcion');
                return true;
            } else {
                alert('Espera que termine de cargar la página o recárgala');
                return false;
            }
        }
        return true;
    },
    run: function() {
        var css_sh = document.createElement('link'),
            button = document.createElement('button');

        css_sh.rel = 'stylesheet';
        css_sh.type = 'text/css';
        css_sh.href = this.icons_stylesheet;
        document.getElementsByTagName('head')[0].appendChild(css_sh);

        button.type = 'button';
        button.id = App.button;
        button.innerHTML = '<i class="mdi mdi-loading mdi-spin" style="animation-duration: 1s"></i>';
        document.getElementById('divPrincipal').appendChild(button);
        App.button = button;

        App.func = App.tools.getPath()[0] === 'evaluaciones' ? 'Evaluation' : 'Average';
        App.createPopup();
        window.App[App.func].init();
        button.addEventListener('click', function() {
            if (App.bindInfo()) {
                window.App[App.func].run();
            }
        }, false);
    },
    createPopup: function() {
        document.getElementById('divPrincipal').insertAdjacentHTML('beforeend', '<div id="tools-popup" class="charging"><div class="popup-toolbar"><div class="about">Las herramientas <i>calcular promedio</i> y <i>rellenar evaluación</i> son funcionalidad de la propia extensión, si te gustaría que se añadieran más, ponte en contacto a través de <a href="mailto:a331330@uach.mx">a331330@uach.mx</a></div><button type="button" id="about-tool" title="Abrir o cerrar información"><i class="mdi mdi-information-outline"></i></button><button type="button" id="close-popup" title="Cerrar ventana"><i class="mdi mdi-close"></i></button></div><div class="popup-body"></div></div>');
        document.getElementById('close-popup').addEventListener('click', App.closePopup, false);
        document.getElementById('about-tool').addEventListener('click', App.toggleAbout, false);
    },
    closePopup: function() {
        document.querySelector('#divPrincipal #tools-popup').classList.remove('opened');
        window.App[App.func].running = false;
    },
    toggleAbout: function() {
        var el = document.querySelector('#divPrincipal #tools-popup .popup-toolbar .about');

        if (el.classList.contains('visible')) {
            el.classList.remove('visible');
        } else {
            el.classList.add('visible');
        }
    },
    Average: {
        semesters: [],
        grades: [],
        running: false,
        init: function() {
            App.button.setAttribute('info', 'Calcular promedio');
            App.button.innerHTML = '<i class="mdi mdi-calculator"></i>';

            document.querySelector('#divPrincipal #tools-popup').classList.add('average');
        },
        bindKardex: function() {
            if (this.semesters.length <= 0) {
                var kardex = document.querySelectorAll('#tbKardex tbody tr.trKardexGris'),
                    semesters = [];
                if (kardex.length >= 1) {
                    kardex.forEach(function(e) {
                        var children = e.children;
                        if (!semesters[parseInt(children[0].innerText) - 1]) {
                            semesters[parseInt(children[0].innerText) - 1] = {};
                            semesters[parseInt(children[0].innerText) - 1].average = 0;
                            semesters[parseInt(children[0].innerText) - 1].count = 0;
                        }
                        if (children[8].innerText !== 'AP' && children[8].innerText !== 'NA') {
                            semesters[parseInt(children[0].innerText) - 1].average += parseFloat(children[3].innerText > 5 ? children[3].innerText : children[4].innerText);
                            semesters[parseInt(children[0].innerText) - 1].count++;
                        }
                    });
                    this.semesters = semesters;
                    this.calc('kardex');
                } else {
                    alert('Espera que termine de cargar la página o recárgala');
                }
            }
        },
        bindGrades: function() {
            if (this.grades.length <= 0) {
                App.tools.ajaxReq('calificaciones', { label: 'IdInscripcion', value: App.sinfo.sreg }, function(resp) {
                    if (resp.calificaciones) {
                        App.Average.grades = resp.calificaciones;
                        App.Average.calc('grades');
                    } else {
                        alert(resp.motivo);
                    }
                }, function() {
                    App.closePopup();
                }, 'Ocurrió un error al intentar obtener tus calificaciones, por favor recarga la página e inténtalo de nuevo');
            }
        },
        run: function() {
            if (!App.Average.running) {
                App.Average.running = true;

                document.querySelector('#divPrincipal #tools-popup').classList.add('opened', 'charging');
                App.Average.bindKardex();
                App.Average.bindGrades();
                document.querySelector('#divPrincipal #tools-popup').classList.remove('charging');
            } else {
                App.closePopup();
            }
        },
        calc: function(context) {
            var colors = ['red', 'orange', 'blue', 'purple', 'pink', 'green'];
            switch (context) {
                case 'kardex':
                    var total = this.semesters.reduce(function(sum, curr) { return sum + curr.average; }, 0),
                        count = this.semesters.reduce(function(sum, curr) { return sum + curr.count; }, 0);

                    document.querySelector('#divPrincipal #tools-popup .popup-body').insertAdjacentHTML('beforeend', '<div class="row general" name="Promedio general"><div class="item ' + colors[Math.floor(Math.random() * colors.length)] + '" average="' + (total / count).toFixed(2) + '">Global</div></div><div class="row semesters" name="Por semestre"></div>');
                    this.semesters.forEach(function(e, i) {
                        document.querySelector('#divPrincipal #tools-popup .popup-body .row.semesters').insertAdjacentHTML('beforeend', '<div class="item ' + colors[Math.floor(Math.random() * colors.length)] + '" average="' + (e.average / e.count).toFixed(2) + '">Semestre ' + (i + 1) + '</div>');
                    });
                    break;
                case 'grades':
                    var grades = App.tools.group(this.grades, 'Descripcion');
                    document.querySelector('#divPrincipal #tools-popup .popup-body').insertAdjacentHTML(
                        'beforeend', '<div class="row partials" name="Parciales por materia"></div>'
                    );

                    for (var e in grades) {
                        document.querySelector('#divPrincipal #tools-popup .popup-body .row.partials').insertAdjacentHTML('beforeend',
                            '<div class="item ' + colors[Math.floor(Math.random() * colors.length)] + '" title="' + e.trim() + '" average="' + App.Average.avg(grades[e]) + '">' + e.trim() + '</div>');
                    }
                    break;
                default:
                    alert('Cálculo desconocido');
                    break;
            }
        },
        avg: function(grade) {
            return grade.length === 0 ? 0 : (
                (grade.length === 3 ? (parseFloat(grade[0].Calificacion)*0.4) : (parseFloat(grade[0].Calificacion)*0.3)) +
                (grade.length >= 2 ? (parseFloat(grade[1].Calificacion)*0.3) : 0) +
                (grade.length === 3 ? (parseFloat(grade[2].Calificacion)*0.3) : 0)
            ).toFixed(2);
        }
    },
    Evaluation: {
        teachers: [],
        running: false,
        isEvalPeriod: null,
        init: function() {
            App.button.setAttribute('info', 'Rellenar evaluación');
            App.button.innerHTML = '<i class="mdi mdi-playlist-check"></i>';
            document.querySelector('#divPrincipal #tools-popup').classList.add('evaluation');
        },
        checkEvalPeriod: function() {
            return (typeof this.isEvalPeriod != null) ? this.isEvalPeriod : App.tools.ajaxReq('evaluaciones', { label: 'idInscripcion', value: '298576' }, function(resp) {
                App.Evaluation.isEvalPeriod = (resp.length > 0);
            }, 'Por favor recarga la página para continuar, o revisa tu conexión a internet');
        },
        bindParams: function() {
            if (this.teachers.length <= 0) {
                var teachers = document.querySelectorAll('#tbMaestros tbody tr');
                if (teachers.length >= 1) {
                    teachers.forEach(function(e) {
                        var info = e.querySelectorAll('td');
                        this.teachers.push({
                            id: parseInt(info[0].innerText),
                            teacher: App.tools.capitalize(info[3].innerText),
                            subject: App.tools.capitalize(info[2].innerText)
                        });
                    });
                    return true;
                } else {
                    alert('Por favor llena tus datos personales primero, si ya lo hiciste recarga la página');
                    return false;
                }
            }
            return true;
        },
        run: function() {
            if (!this.checkEvalPeriod()) {
                App.button.remove();
                alert('Ya has realizado tu evaluación docente 😎. ¡Enhorabuena!');
                throw new Error('Isn\'t allowed to perform this action');
            }

            console.log('executing');
            if (!App.Evaluation.running) {
                App.Evaluation.running = true;

                if (App.Evaluation.bindParams()) {
                    document.querySelector('#divPrincipal #tools-popup').classList.add('opened');
                    document.querySelector('#divPrincipal #tools-popup').classList.remove('charging');

                    if (document.querySelector('#divPrincipal #tools-popup .popup-body').childElementCount < this.teachers.length) {
                        App.Evaluation.teachers.forEach(function(e) {
                            document.querySelector('#divPrincipal #tools-popup .popup-body').insertAdjacentHTML('beforeend',
                                '<div class="row" id="' + e.id + '"><input type="checkbox" class="teacher-control" id="teacher_' + e.id + '_control"><div class="teacher-name" title="' + e.subject + '">' + e.id + '. ' + e.teacher + ' (' + e.subject + ')</div><div class="actions"><select id="teacher_' + e.id + '" disabled><option value="1" selected>1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select><button class="send-button" disabled>Rellenar</button></div></div>');
                        });
                        document.querySelectorAll('#divPrincipal #tools-popup .popup-body .row .teacher-control').forEach(function(e) {
                            e.addEventListener('change', App.Evaluation.toggle, false);
                        });
                        document.querySelectorAll('#divPrincipal #tools-popup .popup-body .row .actions button').forEach(function(e) {
                            e.addEventListener('click', App.Evaluation.process, false);
                        });
                    }
                } else {
                    App.Evaluation.running = false;
                }
            } else {
                App.closePopup();
            }
        },
        toggle: function(el) {
            el.path[1].children[2].childNodes.forEach(function(e) {
                e.disabled = !e.disabled;
            });
        },
        process: function(ev) {
            document.querySelectorAll('#tbEncuesta tbody tr td select[name^="txtEscala_' + ev.path[2].id + '"]').forEach(function(e) {
                e.value = ev.path[1].children[0].value;
                e.options[ev.path[1].children[0].value].selected = true;
            });
        },
    }
};

Window.App = App;
window.addEventListener ? addEventListener("load", App.run(), false) : window.attachEvent ? attachEvent("onload", App.run()) : (onload = App.run());