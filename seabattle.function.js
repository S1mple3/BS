window.onload = function() {
	/* variables
	shipSide	- размер палубы
	user.field 	- игровое поле пользователя
	comp.field 	- игровое поле компьютера
	user.fieldX,
	user.fieldY	- координаты игрового поля пользователя
	comp.fieldX,
	comp.fieldY	- координаты игрового поля компьютера

	0 - пустое место
	1 - палуба корабля
	2 - клетка рядом с кораблём
	3 - обстрелянная клетка
	4 - попадание в палубу
	*/

	'use strict';

	function Field(field) {
		this.fieldSide	= 330,
		this.shipSide	= 33,
		this.shipsData	= [
			'',
			[4, 'fourdeck'],
			[3, 'tripledeck'],
			[2, 'doubledeck'],
			[1, 'singledeck']
		],

		this.field		= field;
		this.fieldX		= field.getBoundingClientRect().top + window.pageYOffset;
		this.fieldY		= field.getBoundingClientRect().left + window.pageXOffset;
		this.fieldRight	= this.fieldY + this.fieldSide;
		this.fieldBtm	= this.fieldX + this.fieldSide;
		this.squadron	= [];
	}


	Field.prototype.getCoordinatesDecks = function(decks) {
		// kx == 1 - вертикально, ky == 1 - горизонтально
		var kx = getRandom(1),
			ky = (kx == 0) ? 1 : 0,
			x, y;

		if (kx == 0) {
			x = getRandom(9);
			y = getRandom(10 - decks);
		} else {
			x = getRandom(10 - decks);
			y = getRandom(9);
		}

		// валидация палуб корабля
		var result = this.checkLocationShip(x, y, kx, ky, decks);
		if (!result) return this.getCoordinatesDecks(decks);

		var obj = {
			x: x,
			y: y,
			kx: kx,
			ky: ky
		};
		return obj;
	}

	Field.prototype.randomLocationShips = function() {
		this.matrix = createMatrix();

		for (var i = 1, length = this.shipsData.length; i < length; i++) {
			// i == кол-во кораблей
			var decks = this.shipsData[i][0]; // кол-во палуб
			for (var j = 0; j < i; j++) {
				// получаем координаты первой палубы и направление расположения палуб (корабля)
				var fc = this.getCoordinatesDecks(decks);

				fc.decks 	= decks,
				fc.shipname	= this.shipsData[i][1] + String(j + 1);

				// создаём экземпляр корабля и выводим на экран
				var ship = new Ships(this, fc);
					ship.createShip();
			}
		}
	}


	Field.prototype.checkLocationShip = function(x, y, kx, ky, decks) {
		var fromX, toX, fromY, toY;

		fromX = (x == 0) ? x : x - 1;
		if (x + kx * decks == 10 && kx == 1) toX = x + kx * decks;
		else if (x + kx * decks < 10 && kx == 1) toX = x + kx * decks + 1;
		else if (x == 9 && kx == 0) toX = x + 1;
		else if (x < 9 && kx == 0) toX = x + 2;

		fromY = (y == 0) ? y : y - 1;
		if (y + ky * decks == 10 && ky == 1) toY = y + ky * decks;
		else if (y + ky * decks < 10 && ky == 1) toY = y + ky * decks + 1;
		else if (y == 9 && ky == 0) toY = y + 1;
		else if (y < 9 && ky == 0) toY = y + 2;

		// если корабль при повороте выходит за границы игрового поля
		// т.к. поворот происходит относительно первой палубы, то 
		// fromX и from, всегда валидны
		if (toX === undefined || toY === undefined) return false;

		for (var i = fromX; i < toX; i++) {
			for (var j = fromY; j < toY; j++) {
				if (this.matrix[i][j] == 1) return false;
			}
		}
		return true;
	}

	Field.prototype.cleanField = function() {
		var parent	= this.field,
			id		= parent.getAttribute('id'),
			divs 	= document.querySelectorAll('#' + id + ' > div');

		[].forEach.call(divs, function(el) {
			parent.removeChild(el);
		});
		// очищаем массив объектов кораблей
		this.squadron.length = 0;
	}

	//создаём экземпляры объектов игровых полей
	var userfield = getElement('field_user'),
		compfield = getElement('field_comp'),
		comp;

	var user = new Field(getElement('field_user'));

	/////////////////////////////////////////

	function Ships(player, fc) {
		this.player 	= player;
		this.shipname 	= fc.shipname;
		this.decks		= fc.decks;
		this.x0			= fc.x; // координата X первой палубы
		this.y0			= fc.y; // координата Y первой палубы
		this.kx			= fc.kx;
		this.ky 		= fc.ky;
		this.hits 		= 0; // попадания
		this.matrix		= []; // координаты палуб
	}

	Ships.prototype.createShip = function() {
		var k		= 0,
			x		= this.x0,
			y		= this.y0,
			kx		= this.kx,
			ky		= this.ky,
			decks	= this.decks,
			player	= this.player

		while (k < decks) {
			// записываем координаты корабля в матрицу игрового поля
			player.matrix[x + k * kx][y + k * ky] = 1;
			// записываем координаты корабля в матрицу экземпляра корабля
			this.matrix.push([x + k * kx, y + k * ky]);
			k++;
		}

		player.squadron.push(this);
		if (player == user) this.showShip();
		//this.showShip();
		if (user.squadron.length == 10) {
			getElement('play').setAttribute('data-hidden', 'false');
		}
	}

	Ships.prototype.showShip = function() {
		var div			= document.createElement('div'),
			dir			= (this.kx == 1) ? ' vertical' : '',
			classname	= this.shipname.slice(0, -1),
			player		= this.player;

		div.setAttribute('id', this.shipname);
		div.className = 'ship ' + classname + dir;
		div.style.cssText = 'left:' + (this.y0 * player.shipSide) + 'px; top:' + (this.x0 * player.shipSide) + 'px;';
		player.field.appendChild(div);
	}

	/////////////////////////////////////////

	function Instance() {
		this.pressed = false;
	}

	Instance.prototype.setObserver = function() {
		var fieldUser		= getElement('field_user'),
			initialShips	= getElement('ships_collection');


		fieldUser.addEventListener('mousedown', this.onMouseDown.bind(this));
		fieldUser.addEventListener('contextmenu', this.rotationShip.bind(this));
		initialShips.addEventListener('mousedown', this.onMouseDown.bind(this));
		document.addEventListener('mousemove', this.onMouseMove.bind(this));
		document.addEventListener('mouseup', this.onMouseUp.bind(this));
	}

	Instance.prototype.onMouseDown = function(e) {
		if (e.which != 1) return false;

		var el = e.target.closest('.ship');
		if (!el) return;
		this.pressed = true;

		// запоминаем переносимый объект и его свойства
		this.draggable = {
			elem:	el,
			//запоминаем координаты, с которых начат перенос
			downX:	e.pageX,
			downY:	e.pageY,
			kx:		0,
			ky:		1
		};

		// нажатие мыши произошло по установленному кораблю, находящемуся
		// в игровом поле юзера (редактирование положения корабля)
		if (el.parentElement.getAttribute('id') == 'field_user') {
			var name = el.getAttribute('id');
			this.getDirectionShip(name);

			var computedStyle	= getComputedStyle(el);
			this.draggable.left	= computedStyle.left.slice(0, -2);
			this.draggable.top	= computedStyle.top.slice(0, -2);

			this.cleanShip(el);
		}
		return false;
	}

	Instance.prototype.onMouseMove = function(e) {
		if (this.pressed == false || !this.draggable.elem) return;

		var coords;

		// посчитать дистанцию, на которую переместился курсор мыши
		/*var moveX = e.pageX - this.draggable.downX,
			moveY = e.pageY - this.draggable.downY;
		if (Math.abs(moveX) < 3 && Math.abs(moveY) < 3) return;*/

		if (!this.clone) {
			this.clone = this.creatClone(e);
			// еслине удалось создать clone
			if (!this.clone) return;
			
			coords = getCoords(this.clone);
			this.shiftX = this.draggable.downX - coords.left;
			this.shiftY = this.draggable.downY - coords.top;

			document.body.appendChild(this.clone);
			this.clone.style.zIndex = '1000';

			this.decks = this.getCountDecks();
		}

		// координаты сторон аватара
		var currLeft	= e.pageX - this.shiftX,
			currTop		= e.pageY - this.shiftY;

		this.clone.style.left = currLeft + 'px';
		this.clone.style.top = currTop + 'px';

		coords = getCoords(this.clone);

		var currBtm		= coords.bottom,
			currRight	= coords.right;

		if (currLeft >= user.fieldY - 14 && currRight <= user.fieldRight + 14 && currTop >= user.fieldX - 14 && currBtm <= user.fieldBtm + 14) {
			// получаем координаты привязанные в сетке поля и в координатах матрицы
			var	coords = this.getCoordsClone(this.decks);
			// проверяем валидность установленных координат
			var result = user.checkLocationShip(coords.x, coords.y, this.draggable.kx, this.draggable.ky, this.decks);

			if (result) {
				this.clone.classList.remove('unsuccess');
				this.clone.classList.add('success');
			} else {
				this.clone.classList.remove('success');
				this.clone.classList.add('unsuccess');
			}
		} else {
			this.clone.classList.remove('success');
			this.clone.classList.add('unsuccess');
		}
		return false;
	}

	Instance.prototype.onMouseUp = function(e) {
		this.pressed = false;
		if (!this.clone) return;

		if (this.clone.classList.contains('unsuccess')) {
			this.clone.classList.remove('unsuccess');
			this.clone.rollback();

			// используется при редактировании положения корабля
			// без этого кода корабль будет возвращаться в левый верхний угол игрового поля
			if (this.draggable.left !== undefined && this.draggable.top !== undefined) {
				this.draggable.elem.style.cssText = 'left:' + this.draggable.left + 'px; top:' + this.draggable.top + 'px;';
			}
		} else {
			var	coords = this.getCoordsClone(this.decks);
			user.field.appendChild(this.clone);
			this.clone.style.left = coords.left + 'px';
			this.clone.style.top = coords.top + 'px';

			// создаём экземпляр корабля
			var	fc = {
					'shipname': this.clone.getAttribute('id'),
					'x': coords.x,
					'y': coords.y,
					'kx': this.draggable.kx,
					'ky': this.draggable.ky,
					'decks': this.decks
				},
				ship = new Ships(user, fc);
			ship.createShip();
			getElement(ship.shipname).style.zIndex = null;
			getElement('field_user').removeChild(this.clone);
		}
		this.cleanClone();
		return false;
	}

	Instance.prototype.creatClone = function(e) {
		var clone	= this.draggable.elem,
			old		= {
				parent:			clone.parentNode,
				nextSibling:	clone.nextSibling,
				left:			clone.left || '',
				top:			clone.top || '',
				zIndex:			clone.zIndex || ''
			};

		clone.rollback = function() {
			old.parent.insertBefore(clone, old.nextSibling);
			clone.style.left = old.left;
			clone.style.top = old.top;
			clone.style.zIndex = old.zIndex;
		};
		return clone;
	}

	Instance.prototype.findDroppable = function(e) {
		this.clone.hidden = true;
		var el = document.elementFromPoint(e.clientX, e.clientY);
		this.clone.hidden = false;
		return el.closest('.ships');
	}

	Instance.prototype.getCountDecks = function() {
		var type = this.clone.getAttribute('id').slice(0, -1);
		for (var i = 1, length = user.shipsData.length; i < length; i++) {
			if (user.shipsData[i][1] === type) {
				return user.shipsData[i][0];
			}
		}
	}

	Instance.prototype.getCoordsClone = function(decks) {
		var pos		= this.clone.getBoundingClientRect(),
			left	= pos.left - user.fieldY,
			right	= pos.right - user.fieldY,
			top		= pos.top - user.fieldX,
			bottom	= pos.bottom - user.fieldX,
			coords	= {};

		coords.top	= (top < 0) ? 0 : (bottom > user.fieldSide) ? user.fieldSide - user.shipSide : top;
		coords.top	= Math.round(coords.top / user.shipSide) * user.shipSide;
		coords.x	= coords.top / user.shipSide;

		coords.left = (left < 0) ? 0 : (right > user.fieldSide) ? user.fieldSide - user.shipSide * decks : left;
		coords.left = Math.round(coords.left / user.shipSide) * user.shipSide;
		coords.y	= coords.left / user.shipSide;
		return coords;
	}

	Instance.prototype.cleanClone = function() {
		delete this.clone;
		delete this.draggable;
	}

	Instance.prototype.rotationShip = function(e) {
		if (e.which != 3) return false;
		e.preventDefault();
		e.stopPropagation();

		var id = e.target.getAttribute('id');

		// ищем корабль, у которого имя совпадает с полученным id
		for (var i = 0, length = user.squadron.length; i < length; i++) {
			var data = user.squadron[i];
			if (data.shipname == id && data.decks != 1) {
				var kx	= (data.kx == 0) ? 1 : 0,
					ky	= (data.ky == 0) ? 1 : 0;

				// удаляем экземпляр корабля
				this.cleanShip(e.target);
				user.field.removeChild(e.target);

				// проверяем валидность координат
				var result = user.checkLocationShip(data.x0, data.y0, kx, ky, data.decks);
				if (result === false) {
					var kx	= (kx == 0) ? 1 : 0,
						ky	= (ky == 0) ? 1 : 0;

					var el = getElement(ship.shipname);
					el.classList.add('unsuccess');
					setTimeout(function() {
						el.classList.remove('unsuccess');
					}, 500);
				}
				// создаём экземпляр корабля
				var	fc = {
						'shipname': data.shipname,
						'x': data.x0,
						'y': data.y0,
						'kx': kx,
						'ky': ky,
						'decks': data.decks
					},
					ship = new Ships(user, fc);

				ship.createShip();
				
				return false;
			}
		}
		return false;
	}

	Instance.prototype.cleanShip = function(el) {
		// получаем координаты в матрице
		var coords = el.getBoundingClientRect(),
			x = Math.round((coords.top - user.fieldX) / user.shipSide),
			y = Math.round((coords.left - user.fieldY) / user.shipSide),
			data, k;

		// ищем корабль, которому принадлежат данные координаты
		for (var i = 0, length = user.squadron.length; i < length; i++) {
			data = user.squadron[i];
			if (data.x0 == x && data.y0 == y) {
				// удаляем из матрицы координаты корабля
				k = 0;
				while(k < data.decks) {
					user.matrix[x + k * data.kx][y + k * data.ky] = 0;
					k++;
				}
				// удаляем корабль из массива 
				user.squadron.splice(i, 1);
				return;
			}
		}
	}

	Instance.prototype.getDirectionShip = function(shipname) {
		var data;
		for (var i = 0, length = user.squadron.length; i < length; i++) {
			data = user.squadron[i];
			if (data.shipname === shipname) {
				this.draggable.kx = data.kx;
				this.draggable.ky = data.ky;
				return;
			}
		}
	}

	/////////////////////////////////////////

	getElement('type_placement').addEventListener('click', function(e) {
		var el = e.target;
		if (el.tagName != 'SPAN') return;

		var shipsCollection = getElement('ships_collection');
		getElement('play').setAttribute('data-hidden', true);
		// очищаем матрицу
		user.cleanField();

		var type = el.getAttribute('data-target'),
			typeGeneration = {
				'random': function() {
					shipsCollection.setAttribute('data-hidden', true);
					user.randomLocationShips();
				},
				'manually': function() {
					user.matrix = createMatrix();
					if (shipsCollection.getAttribute('data-hidden') === 'true') {
						shipsCollection.setAttribute('data-hidden', false);
						var instance = new Instance();
						instance.setObserver();
					} else {
						shipsCollection.setAttribute('data-hidden', true);
					}
				}
			};
		typeGeneration[type]();
	});

	getElement('play').addEventListener('click', function(e) {
		getElement('instruction').setAttribute('data-hidden', true);

		// показываем поле компьютера, создаём объект поля компьютера и расставляем корабли
		document.querySelector('.field-comp').setAttribute('data-hidden', false);
		comp = new Field(compfield);
		comp.randomLocationShips();

		getElement('play').setAttribute('data-hidden', true);
		getElement('text_top').innerHTML = 'Морской бой между эскадрами';

		// удаляем события с поля игрока (отмена редактирования расстановки кораблей)
		userfield.removeEventListener('mousedown', user.onMouseDown);
		userfield.addEventListener('contextmenu', function(e) {
			e.preventDefault();
			e.stopPropagation();
			return false;
		});

		// Запуск модуля игры
		Controller.battle.init();
	});

	/////////////////////////////////////////

	var Controller = (function() {
		var player, enemy, self, coords, text,
			srvText = getElement('text_btm'),
			tm = 0;

		var battle = {
			init: function() {
				self = this;
				var rnd = getRandom(1);
				player = (rnd == 0) ? user : comp;
				enemy = (player === user) ? comp : user;

				// массив с координатами выстрелов при рандомном выборе
				comp.shootMatrix = [];
				// массив с координатами выстрелов для AI
				comp.shootMatrixAI = [];
				// массив с координатами вокруг клетки с попаданием
				comp.shootMatrixAround = [];
				// массив координат начала циклов
				comp.startPoints = [
					[ [6,0], [2,0], [0,2], [0,6] ],
					[ [3,0], [7,0], [9,2], [9,6] ]
				];
				// объекты для хранения первого и след. выстрела
				comp.firstHit = {};
				comp.nextHit = {};

				self.fillShootMatrix();

				if (player === user) {
					// устанавливаем обработчики событий для пользователя
					compfield.addEventListener('click', self.shoot);
					compfield.addEventListener('contextmenu', self.setEmptyCell);
					self.showServiseText('Вы стреляете первым.');
				} else {
					self.showServiseText('Первым стреляет компьютер.');
					setTimeout(function() {
						return self.shoot();
					}, 1000);
				}
			},

			shoot: function(e) {
				// e !== undefined - значит выстрел производит игрок
				// координаты поступают по клику в px и преобразуются в координаты матрицы (coords)
				if (e !== undefined) {
					if (e.which != 1) return false;
					// получаем координаты выстрела
					coords = self.transformCoordinates(e, enemy);
				} else {
					// генерируются матричные координаты выстрела компьютера
					coords = (comp.shootMatrixAround.length) ? self.needShoot() : self.getCoordinatesShot();
				}

				var val	= enemy.matrix[coords.x][coords.y];

				// проверяем какая иконка есть в клетке с данными координатами,
				// если заштрихованная иконка, то удаляем её
				//self.checkCell(coords);

				// будем блокировать выстрел по заштрихованной иконке - case 2


				switch(val) {
					// промах
					case 0:
						// устанавливаем иконку промаха и записываем промах в матрицу
						self.showIcons(enemy, coords, 'dot');
						enemy.matrix[coords.x][coords.y] = 3;

						text = (player === user) ? 'Вы промахнулись. Стреляет компьютер.' : 'Компьютер промахнулся. Ваш выстрел.';
						self.showServiseText(text);

						// определяем, чей выстрел следующий
						player = (player === user) ? comp : user;
						enemy = (player === user) ? comp : user;

						if (player == comp) {
							// снимаем обработчики событий для пользователя
							compfield.removeEventListener('click', self.shoot);
							compfield.removeEventListener('contextmenu', self.setEmptyCell);
							setTimeout(function() {
								return self.shoot();
							}, 1000);
						} else {
							// устанавливаем обработчики событий для пользователя
							compfield.addEventListener('click', self.shoot);
							compfield.addEventListener('contextmenu', self.setEmptyCell);
						}
						break;

					// попадание
					case 1:
						enemy.matrix[coords.x][coords.y] = 4;
						self.showIcons(enemy, coords, 'red-cross');

						text = (player === user) ? 'Поздравляем! Вы попали. Ваш выстрел.' : 'Компьютер попал в ваш корабль. Выстрел компьютера';
						self.showServiseText(text);

						// вносим изменения в массив эскадры
						// необходимо найти корабль, в который попали
						for (var i = enemy.squadron.length - 1; i >= 0; i--) {
							var warship		= enemy.squadron[i], // вся информация о корабле эскадры
								arrayDescks	= warship.matrix; // массив с координатами палуб корабля

							for (var j = 0, length = arrayDescks.length; j < length; j++) {
								// если координаты одной из палуб корабля совпали с координатами выстрела
								// увеличиванием счётчик попаданий
								if (arrayDescks[j][0] == coords.x && arrayDescks[j][1] == coords.y) {
									warship.hits++;
									// если кол-во попаданий в корабль становится равным кол-ву палуб
									// считаем этот корабль уничтоженным и удаляем его из эскадры
									if (warship.hits == warship.decks) {
										enemy.squadron.splice(i, 1);
									}
									break;
								}
							}
						}

						// игра закончена, все корабли эскадры противника уничтожены
						if (enemy.squadron.length == 0) {
							text = (player === user) ? 'Поздравляем! Вы выиграли.' : 'К сожалению, вы проиграли.';
							text += ' Хотите продолжить игру?';
							srvText.innerHTML = text;
							// выводим кнопки да / нет
							// ......

							if (player == user) {
								// снимаем обработчики событий для пользователя
								compfield.removeEventListener('click', self.shoot);
								compfield.removeEventListener('contextmenu', self.setEmptyCell);
							} else {
								//если выиграл комп., показываем оставшиеся корабли компьютера
								for (var i = 0, length = comp.squadron.length; i < length; i++) {
									var div			= document.createElement('div'),
										dir			= (comp.squadron[i].kx == 1) ? ' vertical' : '',
										classname	= comp.squadron[i].shipname.slice(0, -1);

									div.className = 'ship ' + classname + dir;
									div.style.cssText = 'left:' + (comp.squadron[i].y0 * comp.shipSide) + 'px; top:' + (comp.squadron[i].x0 * comp.shipSide) + 'px;';
									comp.field.appendChild(div);
								}
							}
						// бой продолжается
						} else {
							if (player === comp) {
								// отмечаем клетки, где точно не может стоять корабль
								self.markUnnecessaryCell();
								// обстрел клеток вокруг попадания
								self.getNeedCoordinatesShot();	
								// производим новый выстрел
								setTimeout(function() {
									return self.shoot();
								}, 1000);
							}
						}
						break;

					// блокируем выстрел по координатам с заштрихованной иконкой
					case 2:
						text = 'Снимите блокировку с этих координат!';
						self.showServiseText(text);

						// необходимо на 0.5 сек. показать красную заштрихованную иконку
						var icons = enemy.field.querySelectorAll('.shaded-cell');
						[].forEach.call(icons, function(el) {
							var x = el.style.top.slice(0, -2) / comp.shipSide,
								y = el.style.left.slice(0, -2) / comp.shipSide;

							if (coords.x == x && coords.y == y) {
								el.classList.add('shaded-cell_red');
								setTimeout(function() {
									el.classList.remove('shaded-cell_red');
								}, 500);
							}
						});
						break;
					// обстрелянная координата
					case 3:
					case 4:
						text = 'По этим координатам вы уже стреляли!';
						self.showServiseText(text);
						break;
				}
			},

			showIcons: function(enemy, coords, iconClass) {
				var div = document.createElement('div');
				div.className = 'icon-field ' + iconClass;
				div.style.cssText = 'left:' + (coords.y * enemy.shipSide) + 'px; top:' + (coords.x * enemy.shipSide) + 'px;';
				enemy.field.appendChild(div);
			},

			setEmptyCell: function(e) {
				if (e.which != 3) return false;
				e.preventDefault();
				var coords = self.transformCoordinates(e, comp);

				// прежде чем штриховать клетку, необходимо проверить пустая ли клетка
				// если там уже есть закрашивание, то удалить его, если подбитая палуба или промах,
				// то return
				var ch = self.checkCell(coords);
				if (ch) {
					self.showIcons(enemy, coords, 'shaded-cell');
					comp.matrix[coords.x][coords.y] = 2;
				}
			},

			checkCell: function(coords) {
				var icons	= enemy.field.querySelectorAll('.icon-field'),
					flag	= true;

				[].forEach.call(icons, function(el) {
					var x = el.style.top.slice(0, -2) / comp.shipSide,
						y = el.style.left.slice(0, -2) / comp.shipSide;

					if (coords.x == x && coords.y == y) {
						var isShaded = el.classList.contains('shaded-cell');
						if (isShaded) {
							el.parentNode.removeChild(el);
							comp.matrix[coords.x][coords.y] = 0;
						}
						flag = false;
					}
				});
				return flag;
			},

			getCoordinatesShot: function() {
				var val = (comp.shootMatrixAI.length > 0) ? comp.shootMatrixAI.pop() : comp.shootMatrix.pop();
				var obj = {
					x: val[0],
					y: val[1]
				};
				self.deleteElementMatrix(comp.shootMatrix, obj);

				return obj;
			},

			getNeedCoordinatesShot: function() {
				var kx = 0, ky = 0;
				if (Object.keys(comp.firstHit).length === 0) {
					comp.firstHit = coords;
				} else {
					comp.nextHit = coords;
					kx = (Math.abs(comp.firstHit.x - comp.nextHit.x) == 1) ? 1 : 0;
					ky = (Math.abs(comp.firstHit.y - comp.nextHit.y) == 1) ? 1 : 0;
					comp.firstHit = comp.nextHit;
					comp.nextHit = {};
				}

				if (coords.x > 0 && ky == 0) comp.shootMatrixAround.push([coords.x - 1, coords.y]);
				if (coords.x < 9 && ky == 0) comp.shootMatrixAround.push([coords.x + 1, coords.y]);
				if (coords.y > 0 && kx == 0) comp.shootMatrixAround.push([coords.x, coords.y - 1]);
				if (coords.y < 9 && kx == 0) comp.shootMatrixAround.push([coords.x, coords.y + 1]);

				for (var i = comp.shootMatrixAround.length - 1; i >= 0; i--) {
					var x = comp.shootMatrixAround[i][0],
						y = comp.shootMatrixAround[i][1];
					//удаляем точки, по которым уже проводился обстрел или стрельба не имеет смысла
					if (user.matrix[x][y] != 0 && user.matrix[x][y] != 1) {
						comp.shootMatrixAround.splice(i,1);
						self.deleteElementMatrix(comp.shootMatrix, coords);
						if (comp.shootMatrixAI.length != 0) {
							self.deleteElementMatrix(comp.shootMatrixAI, coords);
						}
					}
				}
				return;
			},

			needShoot: function() {
				var val = comp.shootMatrixAround.pop(),
					obj = {
						x: val[0],
						y: val[1]
					};
				// удаляем координаты по которым произошел выстрел
				self.deleteElementMatrix(comp.shootMatrix, obj);
				if (comp.shootMatrixAI.length != 0) {
					self.deleteElementMatrix(comp.shootMatrixAI, obj);
				}
				return obj;
			},

			markUnnecessaryCell: function() {
				var icons	= user.field.querySelectorAll('.icon-field'),
					points	= [
								[coords.x - 1, coords.y - 1],
								[coords.x - 1, coords.y + 1],
								[coords.x + 1, coords.y - 1],
								[coords.x + 1, coords.y + 1]
							];

				for (var i = 0; i < 4; i++) {
					var flag = true;
					if (points[i][0] < 0 || points[i][0] > 9 || points[i][1] < 0 || points[i][1] > 9) continue; // за пределами игрового поля

					// поиск совпадения с иконкой можно реализовать и через forEach, но в этом случае
					// будет просмотренна вся коллекция иконок, к концу боя она может быть близка к 100
					// при поиске через for(), можно прервать цикл при совпадении
					for (var j = 0; j < icons.length; j++) {
						var x = icons[j].style.top.slice(0, -2) / user.shipSide,
							y = icons[j].style.left.slice(0, -2) / user.shipSide;
						if (points[i][0] == x && points[i][1] == y) {
							flag = false;
							break;
						}
					}
					if (flag === false) continue;

					var obj = {
						x: points[i][0],
						y: points[i][1]
					}
					self.showIcons(enemy, obj, 'shaded-cell');
					user.matrix[obj.x][obj.y] = 2;

					// удаляем из массивов выстрелов ненужные координаты
					self.deleteElementMatrix(comp.shootMatrix, obj);
					if (comp.shootMatrixAround.length != 0) {
						self.deleteElementMatrix(comp.shootMatrixAround, obj);
					}
					if (comp.shootMatrixAI.length != 0) {
						self.deleteElementMatrix(comp.shootMatrixAI, obj);
					}
				}
			},

			transformCoordinates: function(e, instance) {
				// полифил для IE
				if (!Math.trunc) {
					Math.trunc = function(v) {
						v = +v;
						return (v - v % 1) || (!isFinite(v) || v === 0 ? v : v < 0 ? -0 : 0);
					};
				}

				var obj = {};
				obj.x = Math.trunc((e.pageY - instance.fieldX) / instance.shipSide),
				obj.y = Math.trunc((e.pageX - instance.fieldY) / instance.shipSide);
				return obj;
			},

			showServiseText: function(text) {
				srvText.innerHTML = '';
				srvText.innerHTML = text;
				/*setTimeout(function() {
					tm = srvText.innerHTML = '';
				}, 1000);*/
			},

			fillShootMatrix: function() {
				// заполняем массив shootMatrix
				for (var i = 0; i < 10; i++) {
					for(var j = 0; j < 10; j++) {
						comp.shootMatrix.push([i, j]);
					}
				}

				// заполняем массив shootMatrixAI
				for (var i = 0, length = comp.startPoints.length; i < length; i++) {
					var arr = comp.startPoints[i];
					for (var j = 0, lh = arr.length; j < lh; j++) {
						var x = arr[j][0],
							y = arr[j][1];

						switch(i) {
							case 0:
								while(x <= 9 && y <= 9) {
									comp.shootMatrixAI.push([x,y]);
									x = (x <= 9) ? x : 9;
									y = (y <= 9) ? y : 9;
									x++; y++;
								};
								break;

							case 1:
								while(x >= 0 && x <= 9 && y <= 9) {
									comp.shootMatrixAI.push([x,y]);
									x = (x >= 0 && x <= 9) ? x : (x < 0) ? 0 : 9;
									y = (y <= 9) ? y : 9;
									x--; y++;
								};
								break;
						}
					}
				}

				// премешиваем массив fillShootMatrixAI
				function compareRandom(a, b) {
					return Math.random() - 0.5;
				}
				comp.shootMatrix.sort(compareRandom);
				comp.shootMatrixAI.sort(compareRandom);
			},

			deleteElementMatrix: function(array, obj) {
				for (var i = 0, lh = array.length; i < lh; i++) {
					// находим ячейку массива, в которой содержатся координата
					// равная координате выстрела и удаляем эту ячейку
					if (array[i][0] == obj.x && array[i][1] == obj.y) {
						array.splice(i, 1);
						break;
					}
				}
			}
		};
	
		return ({
			battle: battle,
			init: battle.init
		});

	})();
	/////////////////////////////////////////

	function getElement(id) {
		return document.getElementById(id);
	}

	function getRandom(n) {
		return Math.floor(Math.random() * (n + 1));
	}

	function createMatrix() {
		var x = 10, y = 10, arr = [10];
		for (var i = 0; i < x; i++) {
			arr[i] = [10];
			for(var j = 0; j < y; j++) {
				arr[i][j] = 0;
			}
		}
		return arr;
	}

	function getCoords(el) {
		var coords = el.getBoundingClientRect();
		return {
			left:	coords.left + window.pageXOffset,
			right:	coords.right + window.pageXOffset,
			top:	coords.top + window.pageYOffset,
			bottom: coords.bottom + window.pageYOffset
		};
	}

	function printMatrix() {
		var print = '';
		for (var x = 0; x < 10; x++) {
			for (var y = 0; y < 10; y++) {
				print += comp.matrix[x][y];
			}
			print += '<br>';
		}
		getElement('matrix').innerHTML = print;
	}

}

// полифил для IE closest
;(function(ELEMENT) {
    ELEMENT.matches = ELEMENT.matches || ELEMENT.mozMatchesSelector || ELEMENT.msMatchesSelector || ELEMENT.oMatchesSelector || ELEMENT.webkitMatchesSelector;
    ELEMENT.closest = ELEMENT.closest || function closest(selector) {
        if (!this) return null;
        if (this.matches(selector)) return this;
        if (!this.parentElement) {return null}
        else return this.parentElement.closest(selector)
      };
}(Element.prototype));