const form = document.querySelector('#generator-form');
const statusNode = document.querySelector('#status');
const resultImage = document.querySelector('#result');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const prompt = form.prompt.value.trim();
  const size = form.size.value;

  if (!prompt) {
    statusNode.textContent = 'Please enter a prompt.';
    return;
  }

  statusNode.textContent = 'Generating image...';
  resultImage.classList.add('hidden');

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, size }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Image generation failed.');
    }

    resultImage.src = payload.imageDataUrl;
    resultImage.classList.remove('hidden');
    statusNode.textContent = 'Done!';
  } catch (error) {
    statusNode.textContent = error.message;
  }
});
