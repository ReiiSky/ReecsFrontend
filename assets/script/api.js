// const baseURL = 'http://127.0.0.1:5000';
async function updateProgressBarV2(percentage) {
    const progressBarID = document.getElementById('progress-bar');
    progressBarID.style = `width: ${percentage}%`;
}
let itv;
function RefreshRecommendation() {
    ws.send('retrain');
    document.getElementById('button-refresh').remove();

    ShowProgressBar(true);

    itv = setInterval(CheckTrainProgress, 500);
}

function homeFn() {
    if (Cookies.get(needRetrained)) {
        Cookies.remove(needRetrained);
        RefreshRecommendation();
    }
}

async function CheckTrainProgress() {
    const result = await fetch(`${baseURL}/movies/train/progress`);
    const data   = await result.json();

    if (Array.isArray(data.data)) {
        const v = JSON.parse(data.data[0]);
        updateProgressBarV2(v.current / v.target * 100);

        if (v.current == v.target) {
            clearInterval(itv);
            setTimeout(() => location.reload(), 2000);
        }
    }
}

async function ApplyListFilm() {
  const searchInput = document.getElementById('search-input');
  const searchInputValue = searchInput.value;
  const userID = Number.parseInt(Cookies.get('user_id'));
  const response = await fetch(`${baseURL}/movies?${searchInputValue}`,
    {
        method: 'GET',
        headers: {
            'User-Id': userID,
        },
    }
  );

  const data = await response.json();

  const movies = data.data.recommendations;
  const html = movies.map(movie => {
    if (movie.rating.given > 0) {
        return;
    }

    return `
      <div class="w-4/5 max-w-xs rounded-lg border-solid border-2 shadow-md my-3 p-2">
          <div class="h-[360px] overflow-hidden"  alt="${movie.title}">
              <div class="place-items-center w-full h-full" alt="${movie.title}"
              style="background-image: url(${movie.image_url}); background-size: cover; background-position: center; background-repeat: no-repeat;"
              ></div>
          </div>
          <div class="px-3 py-3 mx-auto">
              <div class="flex flex-row justify-between items-center">
                  <div id="title" class="font-bold text-xl">${movie.title} <span id="year">(${movie.release_date})</span></div>
                  <div class="flex flex-row items-center">
                      <img src="assets/images/ic_star.svg" class="w-[16px] h-[16px]" alt="star">
                      <p class="ml-1">${movie.rating.real}</p>
                  </div>
              </div>
          
              <div class="flex flex-row items-center mt-2">
                  <!--<p class="font-semibold">Given Rating: </p>
                  <p class="ml-1 text-gray-700">${movie.rating.given || '-'}</p>-->
              </div>
              <div class="flex flex-row items-center mt-2">
                  <p class="font-semibold"></p>
            
                
              </div>
              <div class="flex flex-row items-center mt-2" id="div-rate-${movie.id}">
                  <p class="font-semibold mr-1">Rating Prediction: </p>
                  <img src="assets/images/ic_star.svg" class="w-[16px] h-[16px]" alt="star">
                  <p class="text-gray-700">${movie.rating.predict || '-'}</p>
                  <p id="movie-pred-label-${movie.id}" class="ml-1 text-gray-700"></p>
                  <!--<button id="movie-pred-btn-${movie.id}" class="bg-blue-500 text-white active:bg-blue-600 font-bold uppercase text-xs px-1 py-1 rounded shadow hover:shadow-md outline-none focus:outline-none ml-1 mb-1" type="button" onclick="ShowRating(${movie.film_id}, ${movie.rating.predict})">Show</button>-->
              </div>
              <div class="py-2">
                  ${movie.genres.map((genre) => (
                      `<span class="inline-block bg-gray-200 rounded-full px-3 py-2 text-sm font-semibold text-blue-700 my-1 mx-1">${genre}</span>`
                  )).join('')}
              </div>
          </div>
          <div class="w-full">
              <button class="w-full bg-blue-700 text-white font-semibold py-3 px-4 rounded-b-lg" onclick=ToMovieDetail(${movie.film_id})>Detail</button>
          </div>
        </div>
      `;
  }).filter(m => typeof m === 'string').join('');

  const movieList = document.querySelector('#moviesList');
  if (movieList) movieList.innerHTML = html;
}
