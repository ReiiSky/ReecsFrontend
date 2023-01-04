const baseURLAPI = 'http://localhost:5000';

async function updateProgressBar() {
    await sleep(5000);
    while (true) {
        await sleep(100);
        const triggerTrainResult = await TriggerTrain(true);

        if (triggerTrainResult.data.percentage == 0) {
            Cookies.set('action_count', 0);
            window.location = '/';

            return;
        }
    
        const progressBarID = document.getElementById('progress-bar');
        progressBarID.style = `width: ${triggerTrainResult.data.percentage * 100}%`;
    }
}

async function ApplyListFilm() {
  const searchInput = document.getElementById('search-input');
  const searchInputValue = searchInput.value;
  const userID = Number.parseInt(Cookies.get('user_id'));
  const actionCount = Number.parseInt(Cookies.get('action_count'));
  const isFetchedTriggerTrain = Cookies.get('is-fetched-trigger-train') == 'true';

  if (actionCount >= 3) {
    ShowProgressBar(true);
    if (!isFetchedTriggerTrain) {
        TriggerTrain(false);

        Cookies.set('is-fetched-trigger-train', 'true');

        setTimeout(() => {
            window.location = '/';
        }, 1000);
    }

    await updateProgressBar();
    return 
  }

  Cookies.remove('is-fetched-trigger-train');
  ShowProgressBar(false);

  const response = await fetch(`${baseURLAPI}/movies?${searchInputValue}`,
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
                  <p class="font-semibold">Given Rating: </p>
                  <p class="ml-1 text-gray-700">${movie.rating.given || '-'}</p>
              </div>
              <div class="flex flex-row items-center mt-2" id="div-rate-${movie.film_id}">
                  <p class="font-semibold">Predict Rating: </p>
                  <p id="movie-pred-label-${movie.film_id}" class="ml-1 text-gray-700"></p>
                  <button id="movie-pred-btn-${movie.film_id}" class="bg-blue-500 text-white active:bg-blue-600 font-bold uppercase text-xs px-1 py-1 rounded shadow hover:shadow-md outline-none focus:outline-none ml-1 mb-1" type="button" onclick="ShowRating(${movie.film_id}, ${movie.rating.predict.toFixed(2)})">Show</button>
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
  }).join('');

  const movieList = document.querySelector('#moviesList');
  if (movieList) movieList.innerHTML = html;
}
