tailwind.config = {
    theme: {
        container: {
            center: true,
            padding: {
                DEFAULT: '1rem',
                md: '2rem',
                lg: '50px',
                xl: '120px'
            }
        },
        fontFamily: {
            poppins: 'Poppins, sans-serif'
        },
        extend: {
            colors: {
                primary: '#1E1E1E',
            }
        },
    },
    
    plugins: [
        function ({ addVariant }) {
          addVariant('stars-rating', '& img:hover ~ img')
        },
        function ({ addVariant }) {
          addVariant('current-hover', '& img:hover')
        },
        function ({ addVariant }) {
            addVariant('stars-rating-click', '& img:OnClick ~ img')
          },
          function ({ addVariant }) {
            addVariant('current-click', '& img:OnClick')
          },
      ],
}