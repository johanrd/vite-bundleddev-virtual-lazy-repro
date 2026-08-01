const app = document.querySelector('#app');
app.textContent = 'booted';

// Dynamic import of a plugin-provided virtual module. Rolldown turns this into
// a lazy entry, whose stub id is `\0virtual:lazy-me?rolldown-lazy=1`.
import('./lazy-me')
  .then((m) => {
    app.textContent = m.default;
  })
  .catch((e) => {
    app.textContent = 'ERR ' + e.message;
  });
