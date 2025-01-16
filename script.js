fetch('data.json') // Ganti dengan path ke file JSON Anda
    .then(response => response.json())
    .then(data => {
        // Ambil elemen HTML
        const citySelect = document.getElementById('pilihan-kota');
        const categorySelect = document.getElementById('pilihan-kategori');
        const listRecom = document.getElementById('card');
        const budgetInput = document.getElementById('budget');

        // Ambil data unik untuk kota dan kategori
        const cities = [...new Set(data.map(item => item.City))]; // Menghapus duplikat kota
        const categories = [...new Set(data.map(item => item.Category))]; // Mengambil kategori yang unik

        // Isi elemen <select> dengan data kota
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });

        // Isi elemen <select> dengan data kategori
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option); // Pastikan append ke categorySelect
        });

        // Fungsi untuk menghitung cosine similarity
        function cosineSimilarity(a, b) {
            const dotProduct = a.reduce((sum, val, index) => sum + (val * b[index]), 0);
            const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + (val * val), 0));
            const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + (val * val), 0));
            return dotProduct / (magnitudeA * magnitudeB);
        }

        // Optional: Menampilkan data rekomendasi setelah memilih kota dan kategori
        document.getElementById('cari-button').addEventListener('click', () => {
            const selectedCity = citySelect.value;
            const selectedCategory = categorySelect.value;
            const budget = parseInt(budgetInput.value.replace(/\D/g, ''), 10); // Mengambil input budget dan menghapus karakter non-digit

            // if (isNaN(budget) || budget <= 0) {
            //     alert('Please enter a valid budget.');
            //     return;
            // }

            // Filter data berdasarkan kota, kategori dan budget
            const filteredData = data.filter(item => {
                const isCityMatch = selectedCity ? item.City === selectedCity : true; 
                const isCategoryMatch = selectedCategory ? item.Category === selectedCategory : true; 
                const isBudgetMatch = !isNaN(budget) && budget > 0 ? item.Price <= budget : true; 
                return isCityMatch && isCategoryMatch && isBudgetMatch;
            });

            // Urutkan data berdasarkan rating tertinggi
            const sortedData = filteredData.sort((a, b) => b.Rating - a.Rating); // Rating tertinggi di atas

            // Clear list rekomendasi sebelumnya
            listRecom.innerHTML = '';

            // Gunakan Set untuk memastikan tidak ada duplikasi nama tempat
            const displayedPlaces = new Set();

            // Membangun matriks rating untuk Collaborative Filtering (item-based)
            const places = [...new Set(filteredData.map(item => item.Place_Name))]; // Nama tempat unik
            const placeRatings = {};

            // Membuat matriks rating untuk tempat
            filteredData.forEach(item => {
                if (!placeRatings[item.Place_Name]) {
                    placeRatings[item.Place_Name] = [];
                }
                placeRatings[item.Place_Name].push(item.Rating);
            });

            // Membandingkan tempat berdasarkan cosine similarity
            const similarityMatrix = {};

            places.forEach((placeA, indexA) => {
                places.forEach((placeB, indexB) => {
                    if (indexA < indexB) {
                        const ratingsA = placeRatings[placeA];
                        const ratingsB = placeRatings[placeB];
                        const similarity = cosineSimilarity(ratingsA, ratingsB);

                        if (!similarityMatrix[placeA]) {
                            similarityMatrix[placeA] = {};
                        }
                        similarityMatrix[placeA][placeB] = similarity;
                    }
                });
            });

            // Menampilkan data rekomendasi berdasarkan rating
            sortedData.forEach(item => {
                // Cek apakah nama tempat sudah ditampilkan
                if (!displayedPlaces.has(item.Place_Name)) {
                    displayedPlaces.add(item.Place_Name);

                    const recommendedPlaces = Object.keys(similarityMatrix[item.Place_Name] || {}).sort((a, b) => {
                        return similarityMatrix[item.Place_Name][b] - similarityMatrix[item.Place_Name][a];
                    });

                    const card = document.createElement('div');
                    card.classList.add('card-recom');
                    card.innerHTML = `
                        <h3>${item.Place_Name}</h3>
                        <hr>
                        <p>Rating: ${item.Rating}</p>
                        <p>Harga: Rp ${item.Price}</p>
                        <p>Kategori: ${item.Category}</p>
                        <p>Kota: ${item.City}</p>
                    `;
                    listRecom.appendChild(card);
                }
            });
            
            if (displayedPlaces.size === 0) {
                listRecom.innerHTML = '<p>No recommendations available within your budget.</p>';
            }
            
        });
    })
    .catch(error => console.error('Error membaca JSON:', error));
