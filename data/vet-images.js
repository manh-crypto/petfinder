// Ảnh bệnh viện / phòng khám thú y được sao lưu từ bộ ảnh người dùng cung cấp.
// cover = ảnh bìa, gallery = toàn bộ ảnh, doctors = ảnh đội ngũ/bác sĩ.
const VET_IMAGES = {
  "vc1": {
    "logo": "vc1/logo.jpeg",
    "cover": "vc1/cover.jpeg",
    "gallery": [
      "vc1/gallery-01.jpeg",
      "vc1/gallery-02.webp",
      "vc1/gallery-03.jpeg",
      "vc1/gallery-04.jpeg",
      "vc1/gallery-05.jpeg",
      "vc1/gallery-06.jpeg"
    ],
    "doctors": [
      {
        "img": "vc1/doctor-01.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc1/doctor-02.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc1/doctor-03.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      }
    ]
  },
  "vc2": {
    "logo": "vc2/logo.png",
    "cover": "vc2/cover.png",
    "gallery": [
      "vc2/gallery-01.png",
      "vc2/gallery-02.png",
      "vc2/gallery-03.png",
      "vc2/gallery-04.jpeg",
      "vc2/gallery-05.jpeg",
      "vc2/gallery-06.jpeg"
    ],
    "doctors": [
      {
        "img": "vc2/doctor-01.png",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc2/doctor-02.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc2/doctor-03.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      }
    ]
  },
  "vc3": {
    "logo": "vc3/logo.jpg",
    "cover": "vc3/cover.jpg",
    "gallery": [
      "vc3/gallery-01.jpg",
      "vc3/gallery-02.jpg",
      "vc3/gallery-03.jpg",
      "vc3/gallery-04.jpg",
      "vc3/gallery-05.jpg"
    ],
    "doctors": [
      {
        "img": "vc3/doctor-01.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc3/doctor-02.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc3/doctor-03.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      }
    ]
  },
  "vc4": {
    "logo": "vc4/logo.jpeg",
    "cover": "vc4/cover.png",
    "gallery": [
      "vc4/gallery-01.jpg",
      "vc4/gallery-02.jpeg",
      "vc4/gallery-03.jpg",
      "vc4/gallery-04.png",
      "vc4/gallery-05.jpeg",
      "vc4/gallery-06.jpeg",
      "vc4/gallery-07.jpeg",
      "vc4/gallery-08.png"
    ],
    "doctors": [
      {
        "img": "vc4/doctor-01.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc4/doctor-02.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc4/doctor-03.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      }
    ]
  },
  "vc5": {
    "logo": "vc5/logo.png",
    "cover": "vc5/cover.jpeg",
    "gallery": [
      "vc5/gallery-01.jpeg",
      "vc5/gallery-02.jpeg",
      "vc5/gallery-03.jpeg",
      "vc5/gallery-04.png",
      "vc5/gallery-05.png",
      "vc5/gallery-06.jpeg",
      "vc5/gallery-07.jpeg",
      "vc5/gallery-08.jpeg",
      "vc5/gallery-09.jpeg",
      "vc5/gallery-10.jpeg",
      "vc5/gallery-11.jpeg"
    ],
    "doctors": [
      {
        "img": "vc5/doctor-01.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc5/doctor-02.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc5/doctor-03.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      }
    ]
  },
  "vc6": {
    "logo": "vc6/logo.png",
    "cover": "vc6/cover.jpeg",
    "gallery": [
      "vc6/gallery-01.jpeg",
      "vc6/gallery-02.jpeg",
      "vc6/gallery-03.png",
      "vc6/gallery-04.jpeg",
      "vc6/gallery-05.jpeg",
      "vc6/gallery-06.jpeg",
      "vc6/gallery-07.jpeg",
      "vc6/gallery-08.jpeg",
      "vc6/gallery-09.jpeg",
      "vc6/gallery-10.jpeg"
    ],
    "doctors": [
      {
        "img": "vc6/doctor-01.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc6/doctor-02.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc6/doctor-03.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      }
    ]
  },
  "vc7": {
    "logo": "vc7/logo.jpeg",
    "cover": "vc7/cover.jpeg",
    "gallery": [
      "vc7/gallery-01.jpeg",
      "vc7/gallery-02.jpeg",
      "vc7/gallery-03.jpeg",
      "vc7/gallery-04.jpeg",
      "vc7/gallery-05.jpeg",
      "vc7/gallery-06.jpeg",
      "vc7/gallery-07.jpeg",
      "vc7/gallery-08.jpeg",
      "vc7/gallery-09.jpeg",
      "vc7/gallery-10.jpeg",
      "vc7/gallery-11.jpeg"
    ],
    "doctors": [
      {
        "img": "vc7/doctor-01.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc7/doctor-02.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc7/doctor-03.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc7/doctor-04.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      }
    ]
  },
  "vc8": {
    "logo": "vc8/logo.jpeg",
    "cover": "vc8/cover.png",
    "gallery": [
      "vc8/gallery-01.jpeg",
      "vc8/gallery-02.jpeg",
      "vc8/gallery-03.jpeg",
      "vc8/gallery-04.jpeg",
      "vc8/gallery-05.jpeg",
      "vc8/gallery-06.jpeg",
      "vc8/gallery-07.jpeg",
      "vc8/gallery-08.png",
      "vc8/gallery-09.jpeg",
      "vc8/gallery-10.jpeg",
      "vc8/gallery-11.jpeg"
    ],
    "doctors": [
      {
        "img": "vc8/doctor-01.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc8/doctor-02.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc8/doctor-03.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      }
    ]
  },
  "vc9": {
    "logo": "vc9/logo.jpeg",
    "cover": "vc9/cover.png",
    "gallery": [
      "vc9/gallery-01.jpeg",
      "vc9/gallery-02.jpeg",
      "vc9/gallery-03.jpeg",
      "vc9/gallery-04.png",
      "vc9/gallery-05.jpeg",
      "vc9/gallery-06.jpeg",
      "vc9/gallery-07.jpeg",
      "vc9/gallery-08.jpeg",
      "vc9/gallery-09.jpeg",
      "vc9/gallery-10.jpeg"
    ],
    "doctors": [
      {
        "img": "vc9/doctor-01.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc9/doctor-02.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc9/doctor-03.jpeg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      }
    ]
  }
};
