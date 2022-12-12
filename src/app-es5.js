var USTools = {
    button: 'toolButton',
    icons_stylesheet: 'https://cdn.materialdesignicons.com/4.5.95/css/materialdesignicons.min.css',
    func: 'none',
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
            path.splice(0, 1);
            return path;
        },
        ajaxReq: function(path, onSuccess, onFail, errorMsg) {
            var req = new XMLHttpRequest(),
                reqResp;

            req.open('GET', 'https://segaalumnos.uach.mx/' + path, true);
            req.onload = function() {
                if (req.status == 200) {
                    reqResp = (new DOMParser()).parseFromString(req.responseText,'text/html');
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
            req.setRequestHeader("Content-Type", "text/html; charset=UTF-8");
            req.send();
        }
    },
    run: function() {
        var css_sh = document.createElement('link'),
            button = document.createElement('button');

        css_sh.rel = 'stylesheet';
        css_sh.type = 'text/css';
        css_sh.href = this.icons_stylesheet;
        document.getElementsByTagName('head')[0].appendChild(css_sh);

        button.type = 'button';
        button.id = USTools.button;
        button.innerHTML = '<i class="mdi mdi-loading mdi-spin" style="animation-duration: 1s"></i>';
        document.querySelector('body.page-container-bg-solid').appendChild(button);
        USTools.button = button;

        USTools.func = USTools.tools.getPath()[0] === 'evaluacion_docentes' ? 'Evaluation' : 'Average';
        USTools.createPopup();
        window.USTools[USTools.func].init();
        button.addEventListener('click', window.USTools[USTools.func].run, false);
    },
    createPopup: function() {
        document.querySelector('body.page-container-bg-solid').insertAdjacentHTML('beforeend', '<div id="tools-popup" class="charging"><div class="popup-toolbar"><div class="about">Las herramientas <i>calcular promedio</i> y <i>rellenar evaluación</i> son funcionalidad de la propia extensión, si te gustaría que se añadieran más, ponte en contacto a través de <a href="mailto:a331330@uach.mx">a331330@uach.mx</a></div><button type="button" id="about-tool" title="Abrir o cerrar información"><i class="mdi mdi-information-outline"></i></button><button type="button" id="close-popup" title="Cerrar ventana"><i class="mdi mdi-close"></i></button></div><div class="popup-body"></div></div>');
        document.getElementById('close-popup').addEventListener('click', USTools.closePopup, false);
        document.getElementById('about-tool').addEventListener('click', USTools.toggleAbout, false);
    },
    closePopup: function() {
        document.querySelector('body.page-container-bg-solid #tools-popup').classList.remove('opened');
        window.USTools[USTools.func].running = false;
    },
    toggleAbout: function() {
        var el = document.querySelector('body.page-container-bg-solid #tools-popup .popup-toolbar .about');

        if (el.classList.contains('visible')) {
            el.classList.remove('visible');
        } else {
            el.classList.add('visible');
        }
    },
    Average: {
        semesters: [],
        grades: {},
        running: false,
        init: function() {
            USTools.button.setAttribute('info', 'Calcular promedio');
            USTools.button.innerHTML = '<i class="mdi mdi-calculator"></i>';

            document.querySelector('body.page-container-bg-solid #tools-popup').classList.add('average');
        },
        bindKardex: function() {
            if (this.semesters.length <= 0) {
                var kardex = document.querySelectorAll('table.table tbody tr.hoverTable'),
                    semesters = [];
                if (kardex.length >= 1) {
                    kardex.forEach(function(e) {
                        var children = e.children;
                        if (!semesters[parseInt(children[0].innerText) - 1]) {
                            semesters[parseInt(children[0].innerText) - 1] = {};
                            semesters[parseInt(children[0].innerText) - 1].average = 0;
                            semesters[parseInt(children[0].innerText) - 1].count = 0;
                        }
                        if (children[7].innerText !== 'AP' && children[7].innerText !== 'NA') {
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
            if (Object.keys(USTools.Average.grades).length <= 0) {
                USTools.tools.ajaxReq('calificaciones/index', function(grades) {
                    grades = grades.querySelectorAll('table.table-responsive.table.table-hover tbody tr');
                    var subjects = {};

                    if (grades.length >= 1) {
                        grades.forEach(function(e) {
                            var children = e.children;
                            if (!subjects[children[2].innerText.trim()]) {
                                subjects[children[2].innerText.trim()] = [];
                            }
                            subjects[children[2].innerText.trim()].push({grade: parseFloat(children[5].innerText)});
                        });
                        USTools.Average.grades = subjects;
                        USTools.Average.calc('grades');
                    } else {
                        alert('Espera que termine de cargar la página o recárgala');
                    }
                }, function() {
                    USTools.closePopup();
                }, 'Ocurrió un error al intentar obtener tus calificaciones, por favor recarga la página e inténtalo de nuevo');
            }
        },
        run: function() {
            if (!USTools.Average.running) {
                USTools.Average.running = true;

                document.querySelector('body.page-container-bg-solid #tools-popup').classList.add('opened', 'charging');
                USTools.Average.bindKardex();
                USTools.Average.bindGrades();
                document.querySelector('body.page-container-bg-solid #tools-popup').classList.remove('charging');
            } else {
                USTools.closePopup();
            }
        },
        calc: function(context) {
            var colors = ['red', 'orange', 'blue', 'purple', 'pink', 'green', 'rainbow'];
            switch (context) {
                case 'kardex':
                    var total = this.semesters.reduce(function(sum, curr) { return sum + curr.average; }, 0),
                        count = this.semesters.reduce(function(sum, curr) { return sum + curr.count; }, 0);

                    document.querySelector('body.page-container-bg-solid #tools-popup .popup-body').insertAdjacentHTML('beforeend', '<div class="bodrow general" name="Promedio general"><div class="item ' + colors[Math.floor(Math.random() * colors.length)] + '" average="' + (total / count).toFixed(2) + '">Global</div></div><div class="bodrow semesters" name="Por semestre"></div>');
                    this.semesters.forEach(function(e, i) {
                        document.querySelector('body.page-container-bg-solid #tools-popup .popup-body .bodrow.semesters').insertAdjacentHTML('beforeend', '<div class="item ' + colors[Math.floor(Math.random() * colors.length)] + '" average="' + (e.average / e.count).toFixed(2) + '">Semestre ' + (i + 1) + '</div>');
                    });
                    break;
                case 'grades':
                    var grades = USTools.Average.grades;
                    document.querySelector('body.page-container-bg-solid #tools-popup .popup-body').insertAdjacentHTML(
                        'beforeend', '<div class="bodrow partials" name="Parciales por materia"></div>'
                    );
                    for (var e in grades) {
                        document.querySelector('body.page-container-bg-solid #tools-popup .popup-body .bodrow.partials').insertAdjacentHTML('beforeend',
                            '<div class="item ' + colors[Math.floor(Math.random() * colors.length)] + '" title="' + e.trim() + '" average="' + USTools.Average.avg(grades[e]) + '">' + e.trim() + '</div>');
                    }
                    break;
                default:
                    alert('Cálculo desconocido');
                    break;
            }
        },
        avg: function(grade) {
            return grade.length === 0 ? 0 : (
                (grade.length === 3 ? (parseFloat(grade[0].grade)*0.4) : (parseFloat(grade[0].grade)*0.3)) +
                (grade.length >= 2 ? (parseFloat(grade[1].grade)*0.3) : 0) +
                (grade.length === 3 ? (parseFloat(grade[2].grade)*0.3) : 0)
            ).toFixed(2);
        }
    },
    Evaluation: {
        teachers: [],
        running: false,
        isEvalPeriod: null,
        init: function() {
            USTools.button.setAttribute('info', 'Rellenar evaluación');
            USTools.button.innerHTML = '<i class="mdi mdi-playlist-check"></i>';
            document.querySelector('body.page-container-bg-solid #tools-popup').classList.add('evaluation');
        },
        checkEvalPeriod: function() {
            return (typeof this.isEvalPeriod != null) ? this.isEvalPeriod : USTools.tools.ajaxReq('evaluaciones', { label: 'idInscripcion', value: '298576' }, function(resp) {
                USTools.Evaluation.isEvalPeriod = (resp.length > 0);
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
                            teacher: USTools.tools.capitalize(info[3].innerText),
                            subject: USTools.tools.capitalize(info[2].innerText)
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
                USTools.button.remove();
                alert('Ya has realizado tu evaluación docente 😎. ¡Enhorabuena!');
                throw new Error('Isn\'t allowed to perform this action');
            }

            if (!USTools.Evaluation.running) {
                USTools.Evaluation.running = true;

                if (USTools.Evaluation.bindParams()) {
                    document.querySelector('body.page-container-bg-solid #tools-popup').classList.add('opened');
                    document.querySelector('body.page-container-bg-solid #tools-popup').classList.remove('charging');

                    if (document.querySelector('body.page-container-bg-solid #tools-popup .popup-body').childElementCount < this.teachers.length) {
                        USTools.Evaluation.teachers.forEach(function(e) {
                            document.querySelector('body.page-container-bg-solid #tools-popup .popup-body').insertAdjacentHTML('beforeend',
                                '<div class="bodrow" id="' + e.id + '"><input type="checkbox" class="teacher-control" id="teacher_' + e.id + '_control"><div class="teacher-name" title="' + e.subject + '">' + e.id + '. ' + e.teacher + ' (' + e.subject + ')</div><div class="actions"><select id="teacher_' + e.id + '" disabled><option value="1" selected>1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select><button class="send-button" disabled>Rellenar</button></div></div>');
                        });
                        document.querySelectorAll('body.page-container-bg-solid #tools-popup .popup-body .bodrow .teacher-control').forEach(function(e) {
                            e.addEventListener('change', USTools.Evaluation.toggle, false);
                        });
                        document.querySelectorAll('body.page-container-bg-solid #tools-popup .popup-body .bodrow .actions button').forEach(function(e) {
                            e.addEventListener('click', USTools.Evaluation.process, false);
                        });
                    }
                } else {
                    USTools.Evaluation.running = false;
                }
            } else {
                USTools.closePopup();
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

window.USTools = USTools;
window.addEventListener ? addEventListener("load", USTools.run(), false) : window.attachEvent ? attachEvent("onload", USTools.run()) : (onload = USTools.run());