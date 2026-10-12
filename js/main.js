'use strict';
// Горизонтальная прокрутка для отзывов
const reviewsTrack = document.getElementById('revTrack');
const reviewsPrev  = document.getElementById('revPrev');
const reviewsNext  = document.getElementById('revNext');
const REVIEW_STEP  = 330; // ширина карточки 300 + gap 30

reviewsNext.addEventListener('click', () => {
	const max = reviewsTrack.scrollWidth - reviewsTrack.clientWidth;
	if (reviewsTrack.scrollLeft >= max - 1) {
		reviewsTrack.scrollTo({ left: 0, behavior: 'smooth' });
	} else {
		reviewsTrack.scrollBy({ left: REVIEW_STEP, behavior: 'smooth' });
	}
});

reviewsPrev.addEventListener('click', () => {
	if (reviewsTrack.scrollLeft <= 0) {
		reviewsTrack.scrollTo({ left: reviewsTrack.scrollWidth, behavior: 'smooth' });
	} else {
		reviewsTrack.scrollBy({ left: -REVIEW_STEP, behavior: 'smooth' });
	}
});

// Слайдер шагов оформления товаров
const stepSlides = document.querySelectorAll('.step-card__slide');
const stepDots = document.querySelectorAll('.step-card__dot');
const stepCard = document.getElementById('stepCard');
const stepSection = document.querySelector('.how-to-order');

let stepIndex = 0;
let stepTimer = null;

function showStep(n) {
	stepIndex = n;
	stepSlides.forEach((s, k) => s.classList.toggle('step-card__slide--active', k === n));
	stepDots.forEach((d, k) => d.classList.toggle('step-card__dot--active', k === n));
}

const nextStep = () => showStep((stepIndex + 1) % stepSlides.length);
const startStep = () => { stepTimer ??= setInterval(nextStep, 3000); };
const stopStep = () => { clearInterval(stepTimer); stepTimer = null; };

// Клик по карточке - следующий шаг
stepCard.addEventListener('click', () => {
	nextStep();
	stopStep();
	startStep();
});

// Клик по точке - конкретный шаг
stepDots.forEach(dot => dot.addEventListener('click', (e) => {
	e.stopPropagation();
	showStep(+dot.dataset.index);
	stopStep();
	startStep();
}));

// Enter/Space на карточке - следующий шаг
stepCard.addEventListener('keydown', (e) => {
	if (e.key === 'Enter' || e.key === ' ') {
		e.preventDefault();
		nextStep();
		stopStep();
		startStep();
	}
});

// Автозапуск, когда секция в зоне видимости
new IntersectionObserver(
	([entry]) => entry.isIntersecting ? startStep() : stopStep(),
	{ threshold: 0.5 }
).observe(stepSection);

// Популярные товары, рендер из JSON
const productsGrid = document.querySelector('.products__grid');

async function getPopularItems() {
	const products = (await import('../data/popular.json', { with: { type: 'json' } })).default.products;

	products.forEach(product => {
		productsGrid.innerHTML += `
			<article class="product-card" id="${product.id}"
				style="background-image: url(${product.image_url})">
				<div class="product-card__badge">${product.badge}</div>
				<div class="product-card__spacer"></div>
				<div class="product-card__content">
					<div class="product-card__name">${product.name}</div>
					<div class="product-card__info">
						<div class="product-card__price">${product.price}₽</div>
						<div class="product-card__actions">
							<button class="product-card__more">Подробнее</button>
							<button class="product-card__buy">Заказать</button>
						</div>
					</div>
				</div>
			</article>`;
	});
}

//Печатающиеся факты
const factCard = document.querySelector('.fact-card');
const factText = document.querySelector('.fact-card__text');

// Ссылка на Cloudflare Worker для обхода CORS
const PROXY_URL = 'https://my-cors-proxy.vikulya-2007.workers.dev';

async function translateText(text, targetLang = 'ru') {
	const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const data = await res.json();
	return data[0].map(sentence => sentence[0]).join(' ');
}

async function getFact() {
	factText.innerHTML = '';
	try {
		const targetUrl = 'https://catfact.ninja/fact';
		const finalUrl = `${PROXY_URL}/?url=${encodeURIComponent(targetUrl)}`;
		const res = await fetch(finalUrl);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const data = await res.json();
		const factTextRu = await translateText(data.fact, 'ru');
		typeLetter(factTextRu, factText, 0, 40);
	} catch (err) {
		factText.innerHTML = 'Самый богатый кот в мире стоит 13 миллионов долларов...';
		console.error('Ошибка:', err);
	}
}

factCard.addEventListener('click', () => getFact());

// Выезжающая панель
const catPanel = document.getElementById('panel');
const catImageWrap = document.querySelector('.cat-panel__content');

async function getCat() {
	try {
		catImageWrap.innerText = 'Загрузка...';
		const targetUrl = 'https://aleatori.cat/random.json';
		const finalUrl = `${PROXY_URL}/?url=${encodeURIComponent(targetUrl)}`;
		const res = await fetch(finalUrl);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const data = await res.json();
		catImageWrap.innerHTML = `<img src="${data.url}" alt="Фото кота дня">`;
	} catch (err) {
		catImageWrap.innerHTML = '<img src="../images/best-cat.jpg" alt="Фото кота дня">';
		console.error('Ошибка:', err);
	}
}

document.getElementById('openCatBtn').onclick = () => {
	catPanel.classList.add('cat-panel--open');
	getCat();
};

document.getElementById('closeCatBtn').onclick = () => catPanel.classList.remove('cat-panel--open');

// Закрытие по Esc
document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') catPanel.classList.remove('cat-panel--open');
});

// Печатающийся заголовок
const heroTitle = document.querySelector('.hero__title');
const fullTextHeader = 'Добро пожаловать в Meow Market — магазин, где живёт любовь к котам ♥';

function typeLetter(fullText, element, i, speed) {
	if (i < fullText.length) {
		element.textContent += fullText[i];
		i++;
		setTimeout(() => typeLetter(fullText, element, i, speed), speed);
	}
}

// Начало
(() => {
	typeLetter(fullTextHeader, heroTitle, 0, 30);
	getFact();
	getPopularItems();
})();