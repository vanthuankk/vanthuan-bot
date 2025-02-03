const fs = require('fs');

module.exports = {
    cfg: {
        path: '/',
        author: 'Niio-team',
    },
    on: {
        get: function (req, res) {
            res.set('content-type', 'text/html');
            res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .api-card {
      width: 90%;
      max-width: 600px;
      margin-bottom: 20px;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      background: white;
    }
    @media (max-width: 768px) {
      .api-card {
        width: 95%;
      }
    }
  </style>
</head>
<body class="bg-gray-100 font-sans leading-normal tracking-normal">

  <!-- Header -->
  <header class="bg-gradient-to-r from-blue-500 to-green-400 text-white py-4 shadow-md">
    <div class="container mx-auto flex justify-between items-center px-4">
      <h1 class="text-3xl font-bold">API Documentation</h1>
      <nav>
        <ul class="flex space-x-4">
          <li><a href="#" class="hover:underline">Home</a></li>
          <li><a href="#" class="hover:underline">API</a></li>
          <li><a href="#" class="hover:underline">Contact</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <!-- Main Content -->
  <main class="container mx-auto p-4">
    <section class="api-section">
      <h2 class="text-2xl font-semibold mb-6 text-center">Available APIs</h2>
      
      <!-- API Cards -->
      <div class="api-card">
        <h3 class="text-xl font-bold">Download API</h3>
        <p class="text-gray-600">
          Endpoint: 
          <a href="/download" class="text-blue-500 hover:underline" target="_blank">
            /download
          </a>
        </p>
        <p class="text-gray-500">Description: Download video, images, or music via a URL.</p>
      </div>
      <div class="api-card">
        <h3 class="text-xl font-bold">Random Girl Videos</h3>
        <p class="text-gray-600">
          Endpoint: 
          <a href="/girl-video" class="text-blue-500 hover:underline" target="_blank">
            /girl-video
          </a>
        </p>
        <p class="text-gray-500">Description: Get random girl videos.</p>
      </div>
    </section>
  </main>

  <footer class="bg-gray-800 text-white py-4">
  <div class="container mx-auto text-center">
    <p>
      &copy; 2024 By Hữu Tài
    </p>
    <p>
      Follow on 
      <a href="https://www.facebook.com/Huutaidz.02" target="_blank" class="text-blue-400 hover:underline">
        Facebook
      </a>
    </p>
  </div>
</footer>
</body>
</html>
`);
        },
    },
}