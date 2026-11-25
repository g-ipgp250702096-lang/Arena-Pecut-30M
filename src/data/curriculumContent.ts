import { CriterionCode, DetectiveCase, QuizQuestion } from '../types/arena';

export const ASSETS = {
  stadiumHero: '/src/assets/images/hero_arena_stadium_1795617298976.jpg',
  arifPortrait: '/assets/aistudio/arif_portrait.png',
  ayaPortrait: '/assets/aistudio/aya_portrait.png',
  arifFull: '/assets/aistudio/arif_full.png',
  ayaFull: '/assets/aistudio/aya_full.png',
  homeTrack: '/src/assets/images/sprint_track_home_1795617300175.jpg',
} as const;

export const CURRICULUM_INFO = {
  subject: 'Pendidikan Jasmani Tahun 5',
  standardKandungan: 'Standard Kandungan 1.9: Melakukan kemahiran asas berlari dengan lakuan yang betul.',
  standardPembelajaran: 'Standard Pembelajaran 1.9.1: Berlari pecut pada satu jarak yang ditetapkan.',
  practicalNote: 'Jarak 30 meter dipilih sebagai aktiviti pembelajaran praktikal untuk projek ini.',
  objectives: [
    {
      code: 'O1',
      title: 'Mengenal Pasti Kriteria Teknik',
      description:
        'Murid mengenal pasti sekurang-kurangnya 3 daripada 4 kriteria teknik larian pecut yang betul selepas menonton bahan demonstrasi.',
    },
    {
      code: 'O2',
      title: 'Larian Pecut 30 Meter',
      description:
        'Murid melakukan larian pecut 30 meter dengan menunjukkan sekurang-kurangnya 3 daripada 4 kriteria teknik yang betul dalam sekurang-kurangnya 2 daripada 3 percubaan.',
    },
    {
      code: 'O3',
      title: 'Maklum Balas dan Pembetulan',
      description:
        'Selepas menerima maklum balas, murid mengenal pasti sekurang-kurangnya satu aspek teknik larian pecut yang perlu ditambah baik serta menunjukkan pembetulannya dalam percubaan berikutnya.',
    },
  ],
};

export const PANDUAN_MOD_SEKOLAH: string[] = [
  'Masuk ke aplikasi Arena Pecut 30 Meter.',
  'Klik Mulakan Misi.',
  'Pilih Mod Sekolah.',
  'Baca dan fahami taklimat misi.',
  'Fahami peraturan keselamatan.',
  'Pelajari teknik K1–K4.',
  'Laksanakan larian pecut 30 meter di bawah pengawasan guru.',
  'Buka bahagian rakaman video.',
  'Rakam atau muat naik video larian.',
  'Mainkan video dan gerakkan garis masa ke detik yang ingin disemak.',
  'Tekan PILIH BINGKAI INI untuk mengekstrak gambar penuh pada detik tersebut.',
  'Semak pratonton gambar penuh dan tekan ANALISIS GAMBAR INI.',
  'Teliti garisan pose rangka badan serta laporan K1–K4.',
  'Pilih detik lain jika ingin menyemak bahagian lain seperti kepala atau kaki.',
  'Lengkapkan refleksi kendiri (O3) dan lakukan pembetulan mengikut arahan guru.',
];

export const PANDUAN_MOD_RUMAH: string[] = [
  'Masuk ke aplikasi.',
  'Klik Mulakan Misi.',
  'Pilih Mod Rumah.',
  'Baca dan fahami taklimat keselamatan.',
  'Tonton demonstrasi K1–K4.',
  'Selesaikan aktiviti Detektif Teknik.',
  'Lakukan cabaran pergerakan yang selamat jika sesuai.',
  'Jawab kuiz.',
  'Lengkapkan refleksi kendiri.',
  'Semak status penyelesaian aktiviti.',
];

export const SAFETY_RULES: string[] = [
  'Lakukan aktiviti memanaskan badan sebelum berlari pecut.',
  'Pastikan kawasan laluan larian bebas daripada halangan dan objek berbahaya.',
  'Pakai pakaian sukan dan kasut sukan yang sesuai serta kemas.',
  'Elakkan berlari di atas permukaan yang licin atau tidak selamat.',
  'Patuhi semua arahan guru Pendidikan Jasmani sepanjang sesi.',
  'Berhenti serta-merta jika berasa sakit, pening atau tidak selesa.',
  'Jangan melakukan larian pecut berintensiti maksimum tanpa pengawasan guru.',
];

export const HOME_SAFETY_RULES: string[] = [
  'Lakukan regangan dan memanaskan badan selama 3 hingga 5 minit sebelum latihan teknik.',
  'Pastikan ruang sekeliling di rumah lapang dan selamat tanpa perabot tajam atau lantai licin.',
  'Pakai pakaian yang selesa dan kasut sukan jika berlatih di halaman rumah.',
  'Mod Rumah memfokuskan latihan teknik secara statik atau jarak pendek yang selamat, bukan pecutan penuh.',
  'Berhenti berehat jika berasa letih, pening atau sakit.',
];

export interface TechniqueCriterionSpec {
  code: CriterionCode;
  title: string;
  shortTitle: string;
  keyPoints: string[];
  commonMistake: string;
  guideAgent: 'arif' | 'aya';
  guideNote: string;
}

export const CRITERIA_SPECS: TechniqueCriterionSpec[] = [
  {
    code: 'K1',
    title: 'K1 — Kedudukan Kepala dan Badan',
    shortTitle: 'Kepala dan Badan',
    keyPoints: [
      'Tegakkan kepala secara semula jadi dan selari dengan badan.',
      'Pandang terus ke hadapan ke arah garisan penamat.',
      'Kekalkan postur badan yang stabil dan seimbang.',
      'Condongkan badan sedikit ke hadapan semasa fasa permulaan dan pecutan awal.',
      'Elakkan ketegangan yang tidak perlu pada leher dan bahu.',
    ],
    commonMistake: 'Kepala mendongak terlalu tinggi, menunduk ke bawah melihat kaki, atau badan terlalu membongkok.',
    guideAgent: 'arif',
    guideNote:
      'Kriteria pertama ialah kedudukan kepala dan badan. Tegakkan kepala secara semula jadi, pandang terus ke hadapan, dan condongkan badan sedikit ke hadapan semasa permulaan pecutan tanpa menegangkan leher.',
  },
  {
    code: 'K2',
    title: 'K2 — Ayunan Tangan',
    shortTitle: 'Ayunan Tangan',
    keyPoints: [
      'Hayunkan kedua-dua belah tangan secara berselang-seli ke hadapan dan ke belakang.',
      'Bengkokkan siku secara semula jadi (sekitar sudut tepat yang selesa).',
      'Rehatkan bahu supaya ayunan kekal lancar dan bertenaga.',
      'Elakkan tangan menghayun melintang ke kiri dan ke kanan di hadapan dada.',
    ],
    commonMistake: 'Tangan dihayun lurus ke bawah atau melintang menyilang badan sehingga mengganggu imbangan.',
    guideAgent: 'aya',
    guideNote:
      'Kriteria kedua ialah ayunan tangan. Hayunkan tangan secara berselang-seli ke hadapan dan ke belakang dengan siku dibengkokkan secara semula jadi. Pastikan bahu kekal relaks dan elakkan hayunan ke sisi.',
  },
  {
    code: 'K3',
    title: 'K3 — Pergerakan Kaki',
    shortTitle: 'Pergerakan Kaki',
    keyPoints: [
      'Gerakkan kaki secara berselang-seli dengan pantas dan teratur.',
      'Angkat lutut secara aktif ke hadapan mengikut ritma larian.',
      'Kekalkan koordinasi yang seimbang antara pergerakan tangan dan kaki.',
    ],
    commonMistake: 'Langkah terlalu pendek tanpa angkatan lutut aktif atau pergerakan kaki tidak selaras dengan tangan.',
    guideAgent: 'arif',
    guideNote:
      'Kriteria ketiga ialah pergerakan kaki. Gerakkan kaki secara berselang-seli dengan pantas, angkat lutut secara aktif ke hadapan, dan pastikan pergerakan kaki selaras dengan ayunan tangan.',
  },
  {
    code: 'K4',
    title: 'K4 — Sentuhan dan Tolakan Kaki',
    shortTitle: 'Sentuhan dan Tolakan Kaki',
    keyPoints: [
      'Perhatikan sentuhan bahagian hadapan tapak kaki (bebola kaki) dengan permukaan trek.',
      'Bahagian hadapan tapak kaki membantu menghasilkan tolakan ke hadapan.',
      'Jangan berlari semata-mata di atas hujung jari kaki secara kaku.',
      'Kekalkan koordinasi tolakan kaki yang lancar bagi setiap langkah pecutan.',
    ],
    commonMistake: 'Mendarat dengan tumit secara berat sehingga memperlahankan larian atau berlari kaku di hujung jari kaki.',
    guideAgent: 'aya',
    guideNote:
      'Kriteria keempat ialah sentuhan dan tolakan kaki. Perhatikan sentuhan bahagian hadapan tapak kaki yang membantu tolakan ke hadapan dengan koordinasi yang baik, tanpa berlari secara kaku di atas hujung jari kaki.',
  },
];

export const MISSION_STEPS: string[] = [
  'Patuhi semua arahan guru Pendidikan Jasmani di kawasan padang atau trek.',
  'Bersedia di garisan permulaan dengan postur yang tenang dan fokus.',
  'Lakukan larian pecut 30 meter yang ditetapkan dengan teknik K1 hingga K4 yang betul.',
  'Perlahankan larian secara beransur-ansur selepas melepasi garisan penamat.',
  'Ambil masa rehat dan pemulihan pernafasan yang mencukupi sebelum percubaan seterusnya.',
  'Sediakan rakaman video yang jelas dan stabil untuk disemak bersama Ejen Aya.',
];

export const RECORDING_TIPS: string[] = [
  'Pastikan keseluruhan badan murid kelihatan jelas dari mula hingga tamat larian.',
  'Elakkan halangan seperti kon besar, pelajar lain atau tiang di hadapan kamera.',
  'Rakam di kawasan yang mempunyai pencahayaan yang cukup dan jelas.',
  'Pegang kamera dengan stabil atau gunakan tripod dari sisi laluan larian.',
  'Gunakan kadar bingkai 30 FPS atau lebih tinggi jika disokong oleh peranti.',
  'Rakam klip pendek yang fokus pada aksi larian pecut sebenar sahaja.',
];

export interface TeacherCriterionRubric {
  code: CriterionCode;
  label: string;
  observationGuide: string;
  masteredSummary: string;
  improvementCorrection: string;
  unobservedAdvice: string;
}

export const TEACHER_CRITERIA_RUBRIC: TeacherCriterionRubric[] = [
  {
    code: 'K1',
    label: 'Kedudukan kepala dan pandangan mata',
    observationGuide:
      'Perhatikan sama ada kepala tegak semula jadi, mata memandang terus ke hadapan, dan postur badan stabil tanpa menunduk atau mendongak.',
    masteredSummary:
      'Kepala tegak semula jadi dengan pandangan mata terus ke hadapan dan postur badan yang stabil.',
    improvementCorrection:
      'Tegakkan kepala secara semula jadi, pandang terus ke hadapan ke arah garisan penamat, dan elakkan menunduk melihat kasut atau mendongak terlalu tinggi.',
    unobservedAdvice:
      'Kedudukan kepala dan arah pandangan mata tidak dapat dilihat dengan jelas dalam rakaman. Rakam dari sudut sisi yang terang dengan bahagian kepala berada penuh di dalam bingkai.',
  },
  {
    code: 'K2',
    label: 'Ayunan tangan dan kedudukan siku',
    observationGuide:
      'Perhatikan sama ada kedua-dua tangan dihayun berselang-seli ke hadapan dan ke belakang dengan siku dibengkokkan secara semula jadi serta bahu relaks.',
    masteredSummary:
      'Ayunan tangan berselang-seli ke hadapan dan ke belakang dengan kedudukan siku bengkok secara semula jadi.',
    improvementCorrection:
      'Bengkokkan siku sekitar sudut tepat yang selesa, hayun tangan ke hadapan dan ke belakang dari bahu (bukan melintang di hadapan dada), serta rehatkan bahu.',
    unobservedAdvice:
      'Ayunan tangan dan kedudukan siku kurang jelas atau terlindung. Pastikan bahagian atas badan dan kedua-dua lengan kelihatan jelas tanpa halangan.',
  },
  {
    code: 'K3',
    label: 'Pergerakan kaki dan angkatan lutut',
    observationGuide:
      'Perhatikan sama ada kaki bergerak berselang-seli dengan pantas, lutut diangkat secara aktif ke hadapan, dan selaras dengan ayunan tangan.',
    masteredSummary:
      'Pergerakan kaki berselang-seli dengan angkatan lutut yang aktif dan koordinasi seimbang bersama tangan.',
    improvementCorrection:
      'Tingkatkan angkatan lutut secara aktif ke hadapan pada setiap langkah pecutan dan pastikan ritma kaki bergerak seiring dengan ayunan tangan.',
    unobservedAdvice:
      'Pergerakan kaki dan angkatan lutut tidak dapat dipastikan daripada klip ini. Rakam urutan larian sisi yang merangkumi keseluruhan bahagian pinggul hingga lutut.',
  },
  {
    code: 'K4',
    label: 'Sentuhan dan tolakan kaki',
    observationGuide:
      'Perhatikan sentuhan bahagian hadapan tapak kaki (bebola kaki) pada permukaan trek untuk tolakan ke hadapan yang lancar.',
    masteredSummary:
      'Sentuhan bahagian hadapan tapak kaki menyumbang kepada tolakan ke hadapan yang kemas dan terkoordinasi.',
    improvementCorrection:
      'Fokuskan sentuhan pada bahagian hadapan tapak kaki (bebola kaki) untuk menolak ke hadapan secara lancar; elakkan menghentak tumit atau berlari kaku di atas hujung jari kaki.',
    unobservedAdvice:
      'Sentuhan dan tolakan kaki sukar diperhatikan (kaki terpotong, terlalu jauh, atau video kurang jelas). Rakam dari jarak sesuai dengan keseluruhan kaki dan trek kelihatan penuh.',
  },
];

export const DETEKTIF_TEKNIK_CASES: DetectiveCase[] = [
  {
    id: 'dt1',
    title: 'Kes 1: Pelari Memandang Kasut',
    clue: 'Aya memerhatikan seorang pelari menundukkan kepalanya ke bawah sepanjang 15 meter pertama.',
    focusCriterion: 'K1',
    question: 'Apakah pembetulan terbaik yang patut dicadangkan kepada pelari ini?',
    options: [
      'Tegakkan kepala secara semula jadi dan pandang terus ke hadapan',
      'Dongakkan kepala setinggi mungkin ke atas langit',
      'Pejamkan mata semasa memecut',
    ],
    correctIndex: 0,
    feedbackAya:
      'Tepat sekali! Mengikut K1, kepala perlu tegak semula jadi dengan pandangan terus ke hadapan supaya postur dan arah larian kekal stabil.',
    correctionArif: 'Pandang ke hadapan ke arah garisan penamat, Ejen Pecut!',
  },
  {
    id: 'dt2',
    title: 'Kes 2: Tangan Melintang Di Dada',
    clue: 'Semasa memecut, siku pelari terbuka luas dan tangannya bergerak ke kiri serta ke kanan di hadapan dada.',
    focusCriterion: 'K2',
    question: 'Kriteria manakah yang perlu dibetulkan dan bagaimanakah caranya?',
    options: [
      'K2 — Hayun tangan berselang-seli ke hadapan dan ke belakang dengan siku bengkok semula jadi',
      'K4 — Hentak tumit dengan kuat ke permukaan trek',
      'K1 — Condongkan badan ke belakang',
    ],
    correctIndex: 0,
    feedbackAya:
      'Bagus, Detektif! Ayunan tangan sepatutnya bergerak ke hadapan dan ke belakang secara berselang-seli dengan bahu yang relaks.',
    correctionArif: 'Kunci siku pada sudut selesa dan hayun dari bahu ke hadapan dan ke belakang!',
  },
  {
    id: 'dt3',
    title: 'Kes 3: Langkah Pendek & Lutut Rendah',
    clue: 'Pelari menggerakkan kaki dengan cepat tetapi lututnya hampir tidak diangkat ke hadapan.',
    focusCriterion: 'K3',
    question: 'Apakah petunjuk yang membantu pelari membaiki pergerakan kakinya?',
    options: [
      'Angkat lutut secara aktif ke hadapan mengikut ritma tangan dan kaki',
      'Luruskan lutut sepanjang masa tanpa membengkokkannya',
      'Lompat menggunakan kedua-dua kaki serentak',
    ],
    correctIndex: 0,
    feedbackAya:
      'Betul! Dalam kriteria K3, angkatan lutut secara aktif dan koordinasi tangan-kaki membantu langkah pecutan menjadi lebih bertenaga.',
    correctionArif: 'Angkat lutut dengan aktif dan selaraskan bersama ayunan tangan!',
  },
  {
    id: 'dt4',
    title: 'Kes 4: Berlari Kaku Di Hujung Jari Kaki',
    clue: 'Seorang murid cuba berjengket secara kaku di atas hujung jari kaki kerana menyangka itu teknik pecut.',
    focusCriterion: 'K4',
    question: 'Apakah penerangan yang tepat mengikut teknik K4?',
    options: [
      'Gunakan sentuhan bahagian hadapan tapak kaki untuk menghasilkan tolakan lancar, bukan berlari kaku di hujung jari',
      'Sentiasa mendarat dengan tumit dahulu secara berat',
      'Elakkan menolak permukaan trek dengan kaki',
    ],
    correctIndex: 0,
    feedbackAya:
      'Syabas! Bahagian hadapan tapak kaki menyumbang kepada tolakan pecutan dengan koordinasi yang lancar, dan bukan berlari semata-mata di hujung jari kaki.',
    correctionArif: 'Rasa tolakan yang kemas daripada bebola kaki pada setiap langkah!',
  },
];

export const HOME_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    criterion: 'K1',
    prompt: 'Apakah arah pandangan mata yang betul semasa melakukan larian pecut 30 meter?',
    scenario: 'Arif bersedia di garisan permulaan dan mula memecut ke hadapan.',
    options: [
      'Memandang ke bawah ke arah kasut sepanjang larian',
      'Tegakkan kepala secara semula jadi dan pandang terus ke hadapan',
      'Mendongakkan kepala ke langit sambil berlari',
      'Menoleh ke kiri dan kanan untuk melihat rakan',
    ],
    correctIndex: 1,
    explanationAya:
      'Betul! Pandangan terus ke hadapan dengan kepala tegak semula jadi membantu mengekalkan postur dan arah larian yang stabil.',
    tipArif: 'Sentiasa fokus pada laluan di hadapan kamu, Ejen Pecut!',
  },
  {
    id: 'q2',
    criterion: 'K2',
    prompt: 'Bagaimanakah cara ayunan tangan yang betul semasa larian pecut?',
    scenario: 'Aya memerhatikan kedudukan siku dan arah pergerakan lengan seorang pelari.',
    options: [
      'Tangan dibiarkan lurus tergantung di sisi badan',
      'Kedua-dua tangan dihayun serentak ke hadapan',
      'Hayunan berselang-seli ke hadapan dan ke belakang dengan siku bengkok semula jadi',
      'Tangan dihayun melintang jauh di hadapan dada dari kiri ke kanan',
    ],
    correctIndex: 2,
    explanationAya:
      'Tepat sekali! Ayunan berselang-seli ke hadapan dan belakang dengan siku bengkok secara semula jadi memberi imbangan dan momentum larian.',
    tipArif: 'Ingat: bahu kekal relaks, jangan hayun ke sisi!',
  },
  {
    id: 'q3',
    criterion: 'K3',
    prompt: 'Mengapakah angkatan lutut yang aktif penting dalam pergerakan kaki larian pecut?',
    scenario: 'Semasa fasa pecutan, pelari cuba mengekalkan langkah yang bertenaga.',
    options: [
      'Supaya pelari boleh melompat setinggi mungkin',
      'Untuk menghasilkan langkah yang pantas, teratur dan berkoordinasi dengan tangan',
      'Supaya kaki bergerak ke sisi dengan perlahan',
      'Untuk menghentikan larian dengan cepat',
    ],
    correctIndex: 1,
    explanationAya:
      'Bagus! Angkatan lutut secara aktif dan pergerakan kaki berselang-seli yang terkoordinasi membantu langkah pecutan yang lebih baik.',
    tipArif: 'Kaki dan tangan mesti bergerak seiring seperti satu pasukan!',
  },
  {
    id: 'q4',
    criterion: 'K4',
    prompt: 'Manakah pernyataan yang paling tepat tentang sentuhan dan tolakan kaki (K4)?',
    scenario: 'Murid memerhatikan bahagian tapak kaki yang menyentuh trek semasa memecut.',
    options: [
      'Pelari mesti berlari semata-mata di atas hujung jari kaki secara kaku',
      'Tumit kaki dihentak kuat dahulu pada setiap langkah pecutan',
      'Bahagian hadapan tapak kaki menyentuh permukaan dan membantu tolakan dengan koordinasi baik',
      'Kaki tidak perlu menolak permukaan trek',
    ],
    correctIndex: 2,
    explanationAya:
      'Tepat! Bahagian hadapan tapak kaki menyumbang kepada tolakan pecutan dengan koordinasi yang lancar, dan bukan berlari semata-mata di atas hujung jari kaki.',
    tipArif: 'Hebat! Tolakan yang kemas membuatkan larian lebih lancar.',
  },
  {
    id: 'q5',
    criterion: 'K1',
    prompt: 'Bilakah sedikit kecondongan badan ke hadapan sesuai berlaku semasa larian pecut?',
    scenario: 'Pelari baru memulakan langkah pertama keluar dari garisan permulaan.',
    options: [
      'Semasa fasa permulaan dan pecutan awal secara semula jadi',
      'Hanya selepas tamat larian 30 meter',
      'Dengan membongkokkan badan sehingga hampir menyentuh lutut',
      'Badan mesti sentiasa condong ke belakang',
    ],
    correctIndex: 0,
    explanationAya:
      'Betul! Sedikit kecondongan badan ke hadapan boleh berlaku secara semula jadi semasa fasa pecutan awal sebelum postur menegak stabil.',
    tipArif: 'Bagus! Jangan condong berlebihan sehingga hilang imbangan.',
  },
  {
    id: 'q6',
    criterion: 'K2',
    prompt: 'Seorang murid dilihat mengangkat bahu terlalu tinggi dan menggenggam penumbuk dengan kuat. Apakah nasihat terbaik?',
    scenario: 'Aya melakukan semakan video percubaan pertama murid.',
    options: [
      'Teruskan menegangkan bahu supaya nampak lebih laju',
      'Rehatkan bahu supaya ayunan tangan lebih lancar tanpa ketegangan',
      'Berhenti mengayunkan tangan semasa berlari',
      'Luruskan kedua-dua lengan ke bawah sepenuhnya',
    ],
    correctIndex: 1,
    explanationAya:
      'Tepat sekali! Merehatkan bahu dan mengelakkan ketegangan membantu ayunan tangan yang lebih semula jadi dan selesa.',
    tipArif: 'Kamu sudah berfikir seperti seorang Ejen Analisis!',
  },
];
