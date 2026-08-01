const COMPONENT_PATH = '/components';
const loadedComponents = new WeakSet();

export async function loadComponents(root = document) {
  const placeholders = [...root.querySelectorAll('[data-component]')].filter((element) => !loadedComponents.has(element));

  await Promise.all(placeholders.map(async (placeholder) => {
    const name = placeholder.dataset.component;
    if (!name) return;

    loadedComponents.add(placeholder);
    try {
      const response = await fetch(`${COMPONENT_PATH}/${name}.html`);
      if (!response.ok) throw new Error(`Unable to load component: ${name}`);
      placeholder.innerHTML = await response.text();
    } catch {
      placeholder.replaceChildren();
      placeholder.dataset.componentError = 'true';
    }
  }));

  document.dispatchEvent(new CustomEvent('components:loaded'));
}
