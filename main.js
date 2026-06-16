// Filter
const filters = document.querySelectorAll('.filter');
const cards = document.querySelectorAll('.card');

filters.forEach(btn => {
  btn.addEventListener('click', () => {
    filters.forEach(f => f.classList.remove('active'));
    btn.classList.add('active');
    const tag = btn.dataset.tag;
    cards.forEach(card => {
      if (tag === 'all') {
        card.classList.remove('hidden');
      } else {
        const tags = JSON.parse(card.dataset.tags);
        card.classList.toggle('hidden', !tags.includes(tag));
      }
    });
  });
});

// Expand on click (only cards with expand content)
cards.forEach(card => {
  const expand = card.querySelector('.card-expand');
  if (!expand) return;
  card.addEventListener('click', e => {
    if (e.target.closest('a')) return; // let links through
    card.classList.toggle('open');
  });
});
