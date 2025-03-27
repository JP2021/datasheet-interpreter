// Função para fazer o upload do arquivo
async function uploadFile(file) {
    const formData = new FormData();
    formData.append('datasheet', file);
  
    try {
      const response = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
  
      if (response.ok) {
        console.log('File uploaded successfully:', data);
        return data; // Retorna o caminho do arquivo para uso posterior
      } else {
        console.error('Error uploading file:', data.error);
        alert(data.error); // Exibe o erro ao usuário
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    }
  }
  
  // Função para enviar a pergunta para a API
  async function askQuestion(question, filePath) {
    const requestData = { question, filePath };
  
    try {
      const response = await fetch('http://localhost:3000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      const data = await response.json();
  
      if (response.ok) {
        console.log('Answer received:', data.answer);
        document.getElementById('answer').innerText = data.answer; // Exibe a resposta no front-end
      } else {
        console.error('Error asking question:', data.error);
        alert(data.error); // Exibe o erro ao usuário
      }
    } catch (error) {
      console.error('Request failed:', error);
      alert('An error occurred while processing your request.');
    }
  }
  
  // Exemplo de uso
  const fileInput = document.getElementById('fileInput');
  const questionInput = document.getElementById('questionInput');
  const submitButton = document.getElementById('submitButton');
  
  submitButton.addEventListener('click', async () => {
    const file = fileInput.files[0];
    const question = questionInput.value;
  
    if (file && question) {
      const uploadResponse = await uploadFile(file);
      if (uploadResponse) {
        const filePath = uploadResponse.filePath;
        await askQuestion(question, filePath);
      }
    } else {
      alert('Please select a file and enter a question.');
    }
  });
  