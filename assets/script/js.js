const allstar = document.querySelectorAll(".star");
        let current_star_level = document.querySelector('.current_rating');

        allstar.forEach((star, i) => {
            star.onclick = function() {
                let current_star_level_value = i + 1;
                allstar.forEach((star, j) => {
                    if( current_star_level_value >= j+1 )
                    {
                        star.innerHTML = '&#9733';
                    }else{
                        star.innerHTML = '&#9734';
                    }
                })
            }
        })