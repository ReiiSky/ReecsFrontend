const baseURL = 'http://localhost:5000';

let defaultRating = 0;

function ShowRating(id, rating) {
   document.getElementById(`movie-pred-label-${id}`).innerText = rating != -1 ? rating : defaultRating;

   const parent = document.getElementById(`div-rate-${id}`);
   const child = document.getElementById(`movie-pred-btn-${id}`);
   parent.removeChild(child);
}


function ShowProgressBar(activate) {
   const divProgressBar = document.getElementById('progress-bar-e');

   if (activate) {
      divProgressBar.innerHTML = `<p class="text-[24px] font-semibold">Recommendation Engine still learning by your interests</p>
    <div class="mt-2 w-1/4 h-6 bg-gray-200 rounded-full dark:bg-gray-700">
      <div id='progress-bar' class="h-6 bg-blue-600 rounded-full dark:bg-blue-500" style="width: 10%"></div>
    </div>`;
   } else {
      divProgressBar.innerHTML = '';
   }
}

async function sleep(time) {
   return new Promise(resolve => {
      setTimeout(resolve, time);
   });
}

async function LoginFn() {
   const usernameInput = document.getElementById('username');
   const passwordInput = document.getElementById('password');

   try {
      const result = await fetch(`${baseURL}/login`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify({
            username: usernameInput.value,
            password: passwordInput.value,
         }),
      });

      const response = await result.json();
      if (response.status == 'failed') {
         alert(response.message);
         return;
      }

      Cookies.set('user_id', response.data.user_id);
      Cookies.set('username', usernameInput.value);
      window.location = '/index.html';
   } catch (error) {
      console.log(error);
   }
}

async function RegisterFn() {
   const usernameInput = document.getElementById('username');
   const passwordInput = document.getElementById('password');

   const interestedFilm = Object.keys(movieInterest).
   map(intKey => ({
      id: intKey,
      interested: movieInterest[intKey]
   })).
   filter(int => int.interested).map(int => int.id);

   const notInterestedFilm = Object.keys(movieNotInterest).
   map(intKey => ({
      id: intKey,
      notInterest: movieNotInterest[intKey]
   })).
   filter(int => int.notInterest).map(int => int.id);

   const interestLength = interestedFilm.length;
   const notInterestLength = notInterestedFilm.length;

   if (interestLength + notInterestLength < 3) {
      alert('please choose min 3 films');
      return;
   }

   Cookies.remove('action_count');
   IncrementOrResetRefreshRecommendationAction(interestLength + notInterestLength);

   try {
      const result = await fetch(`${baseURL}/register`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify({
            username: usernameInput.value,
            password: passwordInput.value,
            interest: interestedFilm,
            notInterest: notInterestedFilm,
         }),
      });

      const response = await result.json();
      if (response.status == 'failed') {
         alert(response.message);
         return;
      }

      Cookies.set('user_id', response.data.user_id);
      Cookies.set('username', usernameInput.value);
      window.location = '/index.html';
   } catch (error) {
      console.log(error);
   }
}

async function CreateRating() {
   const rating = Number.parseInt(Cookies.get('move_rating_idx'));
   const movieID = Number.parseInt(Cookies.get('selected_movie_id'));
   const userID = Number.parseInt(Cookies.get('user_id'));

   try {
      const result = await fetch(`${baseURL}/movies/rating/${movieID}`, {
         method: 'POST',
         headers: {
            'User-Id': userID,
            'Content-Type': 'application/json'
         },
         body: JSON.stringify({
            rating: rating + 1,
         }),
      });

      const response = await result.json();
      if (response.status == 'failed') {
         alert(response.message);
         return;
      }

      IncrementOrResetRefreshRecommendationAction();
      alert('success insert rating');
   } catch (error) {
      console.log(error);
   }
}

async function DeleteHistory(filmID) {
   const userID = Number.parseInt(Cookies.get('user_id'));

   try {
      const result = await fetch(`${baseURL}/movies/rating/${filmID}`, {
         method: 'DELETE',
         headers: {
            'User-Id': userID
         },
      });

      const response = await result.json();
      if (response.status == 'failed') {
         alert(response.message);
         return;
      }

      alert('success delete rating');
      IncrementOrResetRefreshRecommendationAction();
      window.location.reload();
   } catch (error) {
      console.log(error);
   }
}

function IncrementOrResetRefreshRecommendationAction(i = 1) {
   let actionCount = Number.parseInt(Cookies.get('action_count'));
   if (Number.isNaN(actionCount)) actionCount = 0;

   Cookies.set('action_count', actionCount + i);
}

function Logout() {
   Cookies.remove('user_id');

   window.location = '/login';
}

async function ApplyHistory() {
   const userID = Number.parseInt(Cookies.get('user_id'));

   try {
      const result = await fetch(`${baseURL}/movies/history`, {
         headers: {
            'User-Id': userID,
         },
      });

      const response = await result.json();

      if (response.status == 'failed') {
         alert(response.message);
         return;
      }

      const genreInterest = [];
      const e = document.getElementById('history-list');
      let historyHTML = '';
      let i = 1;
      for (const h of response.data.histories) {
         const nowDate = new Date();
         const ratingDate = new Date(h.created_at);
         const diff = nowDate.getTime() - ratingDate.getTime();
         genreInterest.push(h.genres.split(','));
         const calculatedInterest = calculateInterest(genreInterest);

         historyHTML += `<div class="flex flex-row mt-3 p-2">
      <div class="w-1/4 h-[240]">
        <div class="place-items-center rounded-md bg-cover w-full h-full" alt="${h.title}" style="background-image: url(${h.image_url})"></div>
      </div>
      <div class="w-3/4 ml-6">
        <a onclick="MovieDetailRecDirect(${h.film_id})" class="font-bold text-xl">${i++}: ${h.title} </a>
        <div class="flex mt-3">
          ${
            '<img src="assets/images/ic_star.svg" class="w-[32px] h-[32px]" alt="">'.repeat(h.rating)
          }
        </div>
        <p class="mt-3"> Genres: </p>
        ${
          calculatedInterest.
            map(gi => `<span class="inline-block bg-gray-200 rounded-full px-3 py-2 text-sm font-semibold text-blue-700 my-1 mx-1">${gi.genre}</span>`).
            join('')
        }
        <p class="text-gray-500 mt-3">${time_ago(new Date(nowDate.getTime() - diff))}</p>
        <button class="w-[174px] bg-red-700 py-2 text-white rounded-md mt-3" onclick="DeleteHistory(${h.film_id})">Delete</button>
      </div>
    </div>`;
      }

      e.innerHTML = historyHTML;
   } catch (error) {
      console.log(error);
   }
}

/**
 * 
 * @param {string[][]} interestPerFilm 
 */
function calculateInterest(interestPerFilm) {
   const totalInterest = {};
   let countOfTotalUniqueInterest = 0;

   for (const interests of interestPerFilm) {
      for (const interest of interests) {
         if (!totalInterest[interest]) {
            countOfTotalUniqueInterest++;
            totalInterest[interest] = 0;
         }

         totalInterest[interest] += 1;
      }
   }

   const sortedInterest = Object.keys(totalInterest).
   map(k => [totalInterest[k], k]).sort((a, b) => b[0] - a[0]);

   return sortedInterest.
   // slice(0, 3).
   map(interest => ({
      genre: interest[1],
      percentage: interest[0] / countOfTotalUniqueInterest * 100
   }));
}

async function ApplyLoginMovies() {
   try {
      const result = await fetch(`${baseURL}/login/movies`);

      const response = await result.json();
      if (response.status == 'failed') {
         alert(response.message);
         return;
      }

      const recommendations = response.data.recommendations;
      const e = document.getElementById('moviesList');

      for (const rec of recommendations) {
         e.innerHTML += `<div class="w-5/6 max-w-xs rounded-lg border-solid border-2 shadow-md my-3 p-2">
      <div class="h-[360px] overflow-hidden" alt="${rec.title}">
        <div class="place-items-center w-full h-full" alt=${rec.title} style="background-image: url(${rec.image_url}); background-size: cover; background-position: center; background-repeat: no-repeat;"></div>
      </div>
      <div class="px-3 py-2 mx-auto">
        <div class="flex flex-row justify-between items-center">
          <div id="title" class="font-bold text-xl">${rec.title}<span id="year">(${rec.release_date})</span>
          </div>
          <div class="flex flex-row items-center">
            <img src="assets/images/ic_star.svg" class="w-[16px] h-[16px]" alt="star">
            <p class="ml-1 mr-1">${rec.rating.real}</p>
          </div>
        </div>
        <div class="py-2">
          ${
            rec.genres.map(g => `<span class="inline-block bg-gray-200 rounded-full px-3 py-2 text-sm font-semibold text-blue-700 my-1 mx-1">${g}</span>`).
            join('')
          }
        </div>
        <div class="flex items-center">
          <input title="You will automatically give 4 rating to this film. Which indicate you like this film." id="checkbox-interest-${rec.film_id}" onchange="ToggleFilmInterest(${rec.film_id})" type="checkbox" value="" class="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
          <label title="You will automatically give 4 rating to this film. Which indicate you like this film." for="checked-checkbox" class="ml-2 text-sm font-medium text-gray-900">I Like it</label>
        </div>

        <div class="flex items-center">
          
        </div>
      </div>
    </div>`;
      }

      // <input title="You will automatically give 2 rating to this film. Which indicate you don't really like this film." id="checkbox-not-interest-${rec.film_id}" onchange="ToggleFilmNotInterest(${rec.film_id})" type="checkbox" value="" class="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
      // <label title="You will automatically give 2 rating to this film. Which indicate you don't really like this film." for="checked-checkbox" class="ml-2 text-sm font-medium text-gray-900">I Don't Really Like it</label>
   } catch (error) {
      console.log(error);
   }
}

const movieInterest = {};

/**
 * @param {number} movieID 
 * @param {'interest' | 'not-interest'} flag 
 */
function onlyOneToggleInterest(movieID, flag) {
   if (flag == 'not-interest' && movieNotInterest[movieID] == false && movieInterest[movieID] == true) {
      uncheckInterest(movieID, 'interest');
   }

   if (flag == 'interest' && movieInterest[movieID] == false && movieNotInterest[movieID] == true) {
      uncheckInterest(movieID, 'not-interest');
   }
}

/**
 * @param {number} movieID 
 * @param {'interest' | 'not-interest'} flag 
 */
function uncheckInterest(movieID, flag) {
   const eID = `checkbox-${flag}-${movieID}`;
   const e = document.getElementById(eID);

   if (flag == 'interest') movieInterest[movieID] = !movieInterest[movieID];
   if (flag == 'not-interest') movieNotInterest[movieID] = !movieNotInterest[movieID];

   e.checked = false;
}

function ToggleFilmInterest(movieID) {
   if (!movieInterest[movieID]) {
      movieInterest[movieID] = false;
   }

   onlyOneToggleInterest(movieID, 'interest');
   movieInterest[movieID] = !movieInterest[movieID];

}

const movieNotInterest = {};

function ToggleFilmNotInterest(movieID) {
   if (!movieNotInterest[movieID]) {
      movieNotInterest[movieID] = false;
   }

   onlyOneToggleInterest(movieID, 'not-interest');
   movieNotInterest[movieID] = !movieNotInterest[movieID];
}

function ToMovieDetail(movieID) {
   Cookies.set('selected_movie_id', movieID);
   window.location = '/moviedetail';
}

function DirectOnGuest() {
   const userID = Cookies.get('user_id');

   if (!userID) window.location = '/login';
}

function ShowName() {
   const e = document.getElementById('hi-username');

   const username = Cookies.get('username');

   e.innerText = `Hi ${username}!`;
}

function ResetSelectedMovieID() {
   Cookies.remove('selected_movie_id');
   Cookies.remove('move_rating_idx');
}

async function MovieDetailRecDirect(id) {
   Cookies.set('selected_movie_id', id);

   window.location = 'moviedetail';
}


async function ApplyMovieDetail() {
   const movieID = Cookies.get('selected_movie_id');
   const userID = Number.parseInt(Cookies.get('user_id'));


   const response = await fetch(`${baseURL}/movies/detail/${movieID}`, {
      method: 'GET',
      headers: {
         'User-Id': userID,
      },
   });

   const data = await response.json();


   if (data.data.rating.given) SelectStart(data.data.rating.given - 1);
   document.querySelector('#movieGenre').innerHTML = data.data.genres.join(', ');
   document.querySelector('#movieTitle').innerHTML = data.data.title;
   document.querySelector('#movieRatingReal').innerHTML = data.data.rating.real;
   document.querySelector('#movieDesc').innerHTML = data.data.description;
   document.querySelector('#movieView').setAttribute('src', data.data.trailer_url);

   defaultRating = data.data.rating.predict.toFixed(2);

   const trailerURL = data.data.trailer_url;
   const splited = trailerURL.split('/');

   document.querySelector('#youtube-src').setAttribute('src', `https://www.youtube.com/embed/${splited[splited.length - 1]}`);

   const recommendations = data.data.recommendations;

   const html = recommendations.filter(dataR => dataR.film_id.toString() != movieID).map(dataR => {
      return `
      <div class="flex flex-row mt-3 p-2">
      <div class="w-2/4 h-[160px]">
          <div class="place-items-center rounded-md bg-cover w-full h-full" alt="${dataR.title}"
           style="background-image: url(${dataR.image_url}); background-size: cover; background-position: center; background-repeat: no-repeat;"
           ></div>
      </div>
      <div class="w-3/4 ml-6 flex flex-col justify-between">
              <a onclick="MovieDetailRecDirect(${dataR.film_id})" class="font-bold text-xl">${dataR.title} <span>${dataR.release_date}</span></a>
              <p class="mt-3 font-semibold">Description: <span class="text-gray-500 font-normal">${dataR.description}</span></p>
              <p class="mt-3 font-semibold">Genres: <span class="text-gray-500 font-normal">${dataR.genres}</span></p>
      </div>   
  </div>
      `;
   }).join('');

   document.querySelector('#recomendation').insertAdjacentHTML('afterbegin', html);
}

function SelectStart(id) {
   for (let startIdx = 0; startIdx < 5; ++startIdx) {
      const e = document.getElementById(`star-${startIdx}`);
      if (startIdx <= id) {
         e.innerHTML = '★';
      } else {
         e.innerHTML = '☆';
      }
   }

   Cookies.set('move_rating_idx', id);
}

function time_ago(time) {

   switch (typeof time) {
      case 'number':
         break;
      case 'string':
         time = +new Date(time);
         break;
      case 'object':
         if (time.constructor === Date) time = time.getTime();
         break;
      default:
         time = +new Date();
   }
   var time_formats = [
      [60, 'seconds', 1], // 60
      [120, '1 minute ago', '1 minute from now'], // 60*2
      [3600, 'minutes', 60], // 60*60, 60
      [7200, '1 hour ago', '1 hour from now'], // 60*60*2
      [86400, 'hours', 3600], // 60*60*24, 60*60
      [172800, 'Yesterday', 'Tomorrow'], // 60*60*24*2
      [604800, 'days', 86400], // 60*60*24*7, 60*60*24
      [1209600, 'Last week', 'Next week'], // 60*60*24*7*4*2
      [2419200, 'weeks', 604800], // 60*60*24*7*4, 60*60*24*7
      [4838400, 'Last month', 'Next month'], // 60*60*24*7*4*2
      [29030400, 'months', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
      [58060800, 'Last year', 'Next year'], // 60*60*24*7*4*12*2
      [2903040000, 'years', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
      [5806080000, 'Last century', 'Next century'], // 60*60*24*7*4*12*100*2
      [58060800000, 'centuries', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
   ];
   var seconds = (+new Date() - time) / 1000,
      token = 'ago',
      list_choice = 1;

   if (seconds == 0) {
      return 'Just now'
   }
   if (seconds < 0) {
      seconds = Math.abs(seconds);
      token = 'from now';
      list_choice = 2;
   }
   var i = 0,
      format;
   while (format = time_formats[i++])
      if (seconds < format[0]) {
         if (typeof format[2] == 'string')
            return format[list_choice];
         else
            return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token;
      }
   return time;
}

async function TriggerTrain(percentageOnly = false) {
   const userID = Number.parseInt(Cookies.get('user_id'));

   const response = await fetch(`${baseURL}/movies/model/train`, {
      method: 'GET',
      headers: {
         'User-Id': userID,
         'Percentage-Only': percentageOnly
      },
   });

   const data = await response.json();
   console.log(data.data);
   return data;
}

setTimeout(() => {
   const fileselectorcsv = document.getElementById('file-selector-test');
   if (fileselectorcsv) {
      const predictTable = document.getElementById('predict-table');

      predictTable.innerHTML += `<tr>
          <th>User ID</th>
          <th>Film ID</th>
          <th>Film Rating</th>
          <th>User Rating</th>
          <th>Predicted Rating</th>
          <th>Loss</th>
        </tr>`;

      fileselectorcsv.onchange = (event) => {
        let errorTotal = 0;

         const reader = new FileReader();
         reader.readAsText(event.target.files[0], "UTF-8");
         reader.onload = async function (evt) {
            const lines = evt.target.result.split('\n');
            const response = await fetch(`${baseURL}/movies/model/test`, {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json'
               },
               body: JSON.stringify({
                  'lists': lines,
               })
            });
            const {
               data
            } = await response.json();
            const {
               predict_list
            } = data;
            const sortedUserIDs = predict_list.sort((a, b) => a.user_id - b.user_id);

            let lastSortedUser = sortedUserIDs[0].user_id;
            let f = true;
            let idx = 0;
            let lastLoss = 0;

            let userCount = 0;

            for (const sortedUser of sortedUserIDs) {
               idx++;
               sortedUser.user_id++;
               sortedUser.film_id++;
               errorTotal += Math.abs(sortedUser.given - sortedUser.predicted);

               if (lastSortedUser != sortedUser.user_id && !f) {
                  predictTable.innerHTML += `<tr style="background-color: #dddddd;">
              <td><b>Summary</b></td>
              <td colspan="5">Mean Absolute Error: ${(lastLoss / userCount).toFixed(4)}</td>
            </tr>`;

                  userCount = 0;
                  lastLoss = 0;
               }

               userCount++;

               f = false;

               lastSortedUser = sortedUser.user_id;

               predictTable.innerHTML += `<tr>
            <td>${sortedUser.user_id}</td>
            <td>${sortedUser.film_id}</td>
            <td>${sortedUser.film_rating}</td>
            <td>${sortedUser.given}</td>
            <td>${sortedUser.predicted.toFixed(4)}</td>
            <td>${Math.abs(sortedUser.given - sortedUser.predicted).toFixed(4)}</td>
          </tr>`

               lastLoss += Math.abs(sortedUser.given - sortedUser.predicted);
            }


            predictTable.innerHTML += `<tr style="background-color: #dddddd;">
              <td><b>Summary</b></td>
              <td colspan="5">Mean Absolute Error: ${(lastLoss / userCount).toFixed(4)}</td>
            </tr>`;

          document.getElementById('average-result').innerText = (errorTotal / idx).toFixed(4);
        }

        reader.onerror = function (evt) {}
      }
   }
}, 1000);