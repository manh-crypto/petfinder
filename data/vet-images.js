// Ảnh bệnh viện / phòng khám thú y được sao lưu từ bộ ảnh người dùng cung cấp.
// cover = ảnh bìa, gallery = toàn bộ ảnh, doctors = ảnh đội ngũ/bác sĩ.
const VET_IMAGES = {
  "vc1": {
    "logo": "vc1/logo.jpg",
    "cover": "vc1/cover.jpg",
    "gallery": [
      "vc1/gallery-01.jpg",
      "vc1/gallery-02.jpg",
      "vc1/gallery-03.jpg",
      "vc1/gallery-04.jpg",
      "vc1/gallery-05.jpg",
      "vc1/gallery-06.jpg"
    ],
    "doctors": [
      {
        "img": "vc1/doctor-01.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc1/doctor-02.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc1/doctor-03.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      }
    ]
  },
  "vc2": {
    "logo": "vc2/logo.jpg",
    "cover": "vc2/cover.jpg",
    "gallery": [
      "vc2/gallery-01.jpg",
      "vc2/gallery-02.jpg",
      "vc2/gallery-03.jpg",
      "vc2/gallery-04.jpg",
      "vc2/gallery-05.jpg",
      "vc2/gallery-06.jpg"
    ],
    "doctors": [
      {
        "img": "vc2/doctor-01.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc2/doctor-02.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc2/doctor-03.jpg",
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
    "logo": "vc4/logo.jpg",
    "cover": "vc4/cover.jpg",
    "gallery": [
      "vc4/gallery-01.jpg",
      "vc4/gallery-02.jpg",
      "vc4/gallery-03.jpg",
      "vc4/gallery-04.jpg",
      "vc4/gallery-05.jpg",
      "vc4/gallery-06.jpg",
      "vc4/gallery-07.jpg",
      "vc4/gallery-08.jpg"
    ],
    "doctors": [
      {
        "img": "vc4/doctor-01.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc4/doctor-02.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc4/doctor-03.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      }
    ]
  },
  "vc5": {
    "logo": "vc5/logo.jpg",
    "cover": "vc5/cover.jpg",
    "gallery": [
      "vc5/gallery-01.jpg",
      "vc5/gallery-02.jpg",
      "vc5/gallery-03.jpg",
      "vc5/gallery-04.jpg",
      "vc5/gallery-05.jpg",
      "vc5/gallery-06.jpg",
      "vc5/gallery-07.jpg",
      "vc5/gallery-08.jpg",
      "vc5/gallery-09.jpg",
      "vc5/gallery-10.jpg",
      "vc5/gallery-11.jpg"
    ],
    "doctors": [
      {
        "img": "vc5/doctor-01.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc5/doctor-02.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc5/doctor-03.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      }
    ]
  },
  "vc6": {
    "logo": "vc6/logo.jpg",
    "cover": "vc6/cover.jpg",
    "gallery": [
      "vc6/gallery-01.jpg",
      "vc6/gallery-02.jpg",
      "vc6/gallery-03.jpg",
      "vc6/gallery-04.jpg",
      "vc6/gallery-05.jpg",
      "vc6/gallery-06.jpg",
      "vc6/gallery-07.jpg",
      "vc6/gallery-08.jpg",
      "vc6/gallery-09.jpg",
      "vc6/gallery-10.jpg"
    ],
    "doctors": [
      {
        "img": "vc6/doctor-01.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc6/doctor-02.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc6/doctor-03.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      }
    ]
  },
  "vc7": {
    "logo": "vc7/logo.jpg",
    "cover": "vc7/cover.jpg",
    "gallery": [
      "vc7/gallery-01.jpg",
      "vc7/gallery-02.jpg",
      "vc7/gallery-03.jpg",
      "vc7/gallery-04.jpg",
      "vc7/gallery-05.jpg",
      "vc7/gallery-06.jpg",
      "vc7/gallery-07.jpg",
      "vc7/gallery-08.jpg",
      "vc7/gallery-09.jpg",
      "vc7/gallery-10.jpg",
      "vc7/gallery-11.jpg"
    ],
    "doctors": [
      {
        "img": "vc7/doctor-01.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc7/doctor-02.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc7/doctor-03.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc7/doctor-04.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      }
    ]
  },
  "vc8": {
    "logo": "vc8/logo.jpg",
    "cover": "vc8/cover.jpg",
    "gallery": [
      "vc8/gallery-01.jpg",
      "vc8/gallery-02.jpg",
      "vc8/gallery-03.jpg",
      "vc8/gallery-04.jpg",
      "vc8/gallery-05.jpg",
      "vc8/gallery-06.jpg",
      "vc8/gallery-07.jpg",
      "vc8/gallery-08.jpg",
      "vc8/gallery-09.jpg",
      "vc8/gallery-10.jpg",
      "vc8/gallery-11.jpg"
    ],
    "doctors": [
      {
        "img": "vc8/doctor-01.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc8/doctor-02.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc8/doctor-03.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      }
    ]
  },
  "vc9": {
    "logo": "vc9/logo.jpg",
    "cover": "vc9/cover.jpg",
    "gallery": [
      "vc9/gallery-01.jpg",
      "vc9/gallery-02.jpg",
      "vc9/gallery-03.jpg",
      "vc9/gallery-04.jpg",
      "vc9/gallery-05.jpg",
      "vc9/gallery-06.jpg",
      "vc9/gallery-07.jpg",
      "vc9/gallery-08.jpg",
      "vc9/gallery-09.jpg",
      "vc9/gallery-10.jpg"
    ],
    "doctors": [
      {
        "img": "vc9/doctor-01.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc9/doctor-02.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      },
      {
        "img": "vc9/doctor-03.jpg",
        "caption": "Hình ảnh bác sĩ / đội ngũ chăm sóc thú cưng"
      }
    ]
  }
};
