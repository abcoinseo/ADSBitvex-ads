# AdsBitvex Ad Network অ্যাপ্লিকেশন হোস্টিং নির্দেশিকা (cPanel + Firebase)

এই নির্দেশিকা আপনাকে AdsBitvex Angular অ্যাপ্লিকেশনটি cPanel হোস্টিং ব্যবহার করে সেটআপ, বিল্ড এবং হোস্ট করতে সাহায্য করবে, যেখানে Firebase Realtime Database এবং Authentication ডেটাবেজ হিসাবে ব্যবহৃত হয়েছে।

## পূর্বশর্ত (Prerequisites)

1.  **Node.js এবং npm/Yarn:** আপনার ডেভেলপমেন্ট মেশিনে Node.js (v16+) এবং npm (Node.js ইনস্টল করলে স্বয়ংক্রিয়ভাবে আসে) অথবা Yarn ইনস্টল করা থাকতে হবে।
2.  **Firebase Project:** আপনার একটি সক্রিয় Firebase প্রজেক্ট থাকতে হবে যেখানে Firebase Authentication (Email/Password) এবং Firebase Realtime Database সক্ষম করা আছে।
3.  **Firebase Web App Configuration:** আপনার Firebase প্রজেক্টে একটি Web App যুক্ত করুন এবং এর কনফিগারেশন ডিটেইলস (apiKey, authDomain, projectId ইত্যাদি) সংরক্ষণ করুন।
4.  **cPanel হোস্টিং:** আপনার একটি cPanel হোস্টিং অ্যাকাউন্ট থাকতে হবে যেখানে ফাইল ম্যানেজার এবং SSH অ্যাক্সেস (যদি উপলব্ধ থাকে) ব্যবহার করা যাবে।

## ধাপ 1: প্রজেক্ট সেটআপ এবং পরিবেশ ভেরিয়েবল (.env)

1.  **প্রজেক্ট ডাউনলোড/কপি করুন:** প্রথমে আপনার ডেভেলপমেন্ট মেশিনে প্রজেক্ট ফাইলগুলি ডাউনলোড বা কপি করুন।

2.  **`.env` ফাইল তৈরি করুন:** প্রজেক্টের রুট ডিরেক্টরিতে (যেখানে `package.json` আছে) `.env.example` ফাইলটির একটি কপি তৈরি করুন এবং সেটির নাম পরিবর্তন করে `.env` রাখুন।

3.  **Firebase কনফিগারেশন যোগ করুন:** আপনার `.env` ফাইলটি খুলুন এবং আপনার Firebase Web App থেকে প্রাপ্ত কনফিগারেশন ডিটেইলস দিয়ে নিচের ভেরিয়েবলগুলো পূরণ করুন:

    ```env
    # Firebase Web App Configuration
    VITE_FIREBASE_API_KEY="আপনার_ফায়ারবেজ_এপিআই_কী"
    VITE_FIREBASE_AUTH_DOMAIN="আপনার_অথ_ডোমেইন.firebaseapp.com"
    VITE_FIREBASE_DATABASE_URL="https://আপনার_প্রজেক্ট_আইডি-default-rtdb.firebaseio.com"
    VITE_FIREBASE_PROJECT_ID="আপনার_প্রজেক্ট_আইডি"
    VITE_FIREBASE_STORAGE_BUCKET="আপনার_প্রজেক্ট_আইডি.appspot.com"
    VITE_FIREBASE_MESSAGING_SENDER_ID="আপনার_মেসেজিং_সেন্ডার_আইডি"
    VITE_FIREBASE_APP_ID="আপনার_অ্যাপ_আইডি"
    ```
    **গুরুত্বপূর্ণ:** `VITE_` প্রিফিক্সটি এখানে ব্যবহার করা হয়েছে কারণ এই পরিবেশ ভেরিয়েবলগুলি Angular অ্যাপ্লিকেশনের (সাধারণত Vite দ্বারা ডেভেলপ করা হলে) বিল্ড টাইমে ইনজেক্ট করা হয়। আমাদের Applet এনভায়রনমেন্টে, `process.env` অবজেক্টটি Applet হোস্ট দ্বারা এই কনফিগারেশনগুলো দিয়ে পপুলেট করা হবে, তাই কোডে `process.env.VITE_FIREBASE_API_KEY` ব্যবহার করা হয়েছে। নিশ্চিত করুন যে আপনার `.env` ফাইলটি সঠিক ফরম্যাটে আছে।

## ধাপ 2: ডেভেলপমেন্ট এনভায়রনমেন্টে পরীক্ষা (ঐচ্ছিক)

আপনি চাইলে আপনার লোকাল মেশিনে অ্যাপ্লিকেশনটি পরীক্ষা করতে পারেন:

1.  প্রজেক্ট রুটে নেভিগেট করুন:
    ```bash
    cd your-adsbitvex-project
    ```
2.  ডিপেন্ডেন্সি ইনস্টল করুন:
    ```bash

    # অথবা
    yarn install
    ```
3.  অ্যাপ্লিকেশনটি চালান:
    ```bash
    npm start
    # অথবা
    yarn start
    ```
    এটি সাধারণত `http://localhost:4200` এ অ্যাপ্লিকেশনটি চালু করবে।

## ধাপ 3: প্রোডাকশন বিল্ড তৈরি করুন

আপনার Angular অ্যাপ্লিকেশনকে হোস্টিং এর জন্য উপযুক্ত একটি প্রোডাকশন বিল্ড তৈরি করতে হবে। এই বিল্ডটি অপ্টিমাইজড HTML, CSS, এবং JavaScript ফাইল নিয়ে গঠিত।

1.  প্রজেক্ট রুটে নেভিগেট করুন।
2.  প্রোডাকশন বিল্ড কমান্ড চালান:
    ```bash
    npm run build
    # অথবা
    yarn build
    ```
    এই কমান্ডটি প্রজেক্টের রুট ডিরেক্টরিতে (যদি বিল্ড কনফিগারেশন ডিফল্ট থাকে) একটি `dist/` ফোল্ডার তৈরি করবে। এই `dist/` ফোল্ডারের ভিতরে আপনার ওয়েবসাইট হোস্ট করার জন্য প্রয়োজনীয় সমস্ত ফাইল থাকবে।

## ধাপ 4: cPanel এ ফাইল আপলোড করুন

1.  **cPanel এ লগইন করুন:** আপনার হোস্টিং প্রোভাইডারের মাধ্যমে cPanel এ লগইন করুন।
2.  **ফাইল ম্যানেজার ওপেন করুন:** cPanel ড্যাশবোর্ডে "Files" সেকশনের অধীনে "File Manager" এ ক্লিক করুন।
3.  **পাবলিক HTML ডিরেক্টরিতে যান:**
    *   আপনার যদি মূল ডোমেইনে হোস্ট করতে হয়, তাহলে `public_html` ফোল্ডারে নেভিগেট করুন।
    *   যদি কোনো সাবডোমেইন বা অ্যাডন ডোমেইনে হোস্ট করতে হয়, তাহলে সেই ডোমেইনের নির্দিষ্ট ফোল্ডারে (যেমন `public_html/your_subdomain`) নেভিগেট করুন।
4.  **আগের ফাইল মুছে ফেলুন (যদি থাকে):** যদি `public_html` বা নির্দিষ্ট ডোমেইন ফোল্ডারে কোনো পুরোনো ফাইল (যেমন `index.html`) থাকে, তাহলে সেগুলো মুছে ফেলা ভালো।
5.  **`dist` ফোল্ডারের বিষয়বস্তু আপলোড করুন:**
    *   আপনার লোকাল ডেভেলপমেন্ট মেশিনে তৈরি `dist/` ফোল্ডারের ভিতরে যান।
    *   এই ফোল্ডারের **সমস্ত বিষয়বস্তু** (ফোল্ডার সহ, যেমন `index.html`, `main.js`, `styles.css` ইত্যাদি) জিপ (ZIP) করুন।
    *   cPanel ফাইল ম্যানেজারে "Upload" বাটনে ক্লিক করুন এবং আপনার তৈরি করা জিপ ফাইলটি আপলোড করুন।
    *   আপলোড সম্পন্ন হলে, জিপ ফাইলটি সিলেক্ট করে "Extract" অপশনটি ব্যবহার করে ফাইলগুলো আপনার `public_html` (বা নির্দিষ্ট ডোমেইন) ফোল্ডারে এক্সট্রাক্ট করুন।

## ধাপ 5: `.htaccess` ফাইল কনফিগারেশন (গুরুত্বপূর্ণ!)

Angular অ্যাপ্লিকেশনে ক্লায়েন্ট-সাইড রাউটিং (`/#/admin`, `/#/advertiser`, `/#/publisher` ইত্যাদি) ব্যবহার হয়। সরাসরি এই URL গুলোতে অ্যাক্সেস করলে সার্ভার সাধারণত ফাইল খুঁজে পায় না এবং 404 এরর দেয়। এটি সমাধানের জন্য আপনাকে একটি `.htaccess` ফাইল কনফিগার করতে হবে যাতে সব রিকোয়েস্ট `index.html` এ রিডিরেক্ট হয়।

1.  **`.htaccess` ফাইল তৈরি করুন:** cPanel ফাইল ম্যানেজারে, আপনার `public_html` (বা যেখানে ফাইলগুলো আপলোড করেছেন) ফোল্ডারে একটি নতুন ফাইল তৈরি করুন এবং এর নাম `.htaccess` দিন।
2.  **নিম্নলিখিত কোড যোগ করুন:** `.htaccess` ফাইলটি এডিট করুন এবং নিচের কোডটি পেস্ট করুন:

    ```apache
    RewriteEngine On
    # If an existing asset or directory is requested go to it as usual
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]

    # If the requested resource doesn't exist, use index.html
    RewriteRule ^ index.html [L]
    ```
    এই কনফিগারেশন নিশ্চিত করবে যে যেকোনো রিকোয়েস্ট যা কোনো ফাইল বা ডিরেক্টরির সাথে মেলে না, সেটি `index.html` এ রিডিরেক্ট হবে, যা আপনার Angular অ্যাপ্লিকেশনকে রাউটিং হ্যান্ডেল করার সুযোগ দেবে।

## ধাপ 6: অ্যাডমিন ইমেইল/পাসওয়ার্ড পরিবর্তন (Firebase Authentication)

আপনার Firebase Authentication-এ একটি অ্যাডmin অ্যাকাউন্ট সেট আপ করা উচিত।

1.  **Firebase Console এ যান:** আপনার Firebase প্রজেক্টে লগইন করুন।
2.  **Authentication এ যান:** বাম পাশের মেনু থেকে "Authentication" এ ক্লিক করুন।
3.  **ইউজার যোগ করুন:** "Users" ট্যাবে গিয়ে "Add user" বাটনে ক্লিক করুন।
    *   ইমেইল: `abcoinseo@gmail.com`
    *   পাসওয়ার্ড: আপনার পছন্দের একটি শক্তিশালী পাসওয়ার্ড সেট করুন।
4.  **অ্যাডমিন রোল:** এই অ্যাপ্লিকেশনে, `abcoinseo@gmail.com` ইমেইলটি একটি অ্যাডমিন হিসেবে হার্ডকোড করা আছে (ডেমো পারপাসে)। বাস্তবে, আপনি Firebase Custom Claims ব্যবহার করে রোলের অনুমতি দিতে পারেন।

## **নতুন ফিচার: ডিপোজিট এবং উইথড্রয়াল সিস্টেম**

AdsBitvex এখন বিজ্ঞাপনদাতা এবং প্রকাশকদের জন্য একটি সম্পূর্ণ ডিপোজিট এবং উইথড্রয়াল সিস্টেম নিয়ে এসেছে, যা অ্যাডমিন প্যানেল থেকে সম্পূর্ণরূপে নিয়ন্ত্রণ করা যায়।

### **1. অ্যাডমিন প্যানেল: ডিপোজিট অপশন ব্যবস্থাপনা**

অ্যাডমিন `abcoinseo@gmail.com` হিসাবে লগইন করার পর, "Admin Panel" -> "Deposit Options" এ গিয়ে ডিপোজিট পদ্ধতিগুলো সেট আপ করতে পারবেন:

*   **নতুন অপশন যোগ করুন/সম্পাদনা করুন:**
    *   **Option Name (অপশনের নাম):** ডিপোজিট পদ্ধতির নাম (যেমন: USDT (TRC20), Bank Transfer)।
    *   **Description / Instructions (বর্ণনা/নির্দেশাবলী):** ব্যবহারকারীদের জন্য বিস্তারিত নির্দেশাবলী (যেমন: কোন নেটওয়ার্ক ব্যবহার করতে হবে, পেমেন্টের ধাপ)।
    *   **Minimum & Maximum Amount (সর্বনিম্ন ও সর্বোচ্চ পরিমাণ):** এই পদ্ধতির মাধ্যমে ডিপোজিট করা যাবে এমন সর্বনিম্ন ও সর্বোচ্চ পরিমাণ।
    *   **Address / Info (ঠিকানা/তথ্য):** যেখানে ব্যবহারকারীরা তহবিল পাঠাবে (যেমন: ক্রিপ্টো ওয়ালেট ঠিকানা, ব্যাংক অ্যাকাউন্ট নম্বর)।
    *   **Offer Reward on Deposit? (ডিপোজিটে পুরস্কার অফার করবেন?):** যদি এটি সক্ষম করা হয়, তাহলে ব্যবহারকারীরা ডিপোজিট করার সময় একটি অতিরিক্ত পুরস্কার পাবে।
    *   **Reward Percentage (%) (পুরস্কার শতাংশ):** ডিপোজিট করা পরিমাণের কত শতাংশ পুরস্কার হিসাবে দেওয়া হবে (যেমন: 5% মানে $100 ডিপোজিটে $5 পুরস্কার)।
    *   **Requires Transaction ID/Link? (লেনদেন আইডি/লিঙ্ক প্রয়োজন?):** যদি এটি সক্ষম করা হয়, ব্যবহারকারীকে তার ডিপোজিটের প্রমাণ হিসাবে একটি লেনদেন আইডি বা লিঙ্ক প্রদান করতে হবে।
*   **অপশনগুলো দেখুন এবং পরিচালনা করুন:** অ্যাডমিন সকল বিদ্যমান ডিপোজিট অপশনের তালিকা, তাদের বিবরণ, পরিমাণ সীমা, ঠিকানা, পুরস্কারের অবস্থা এবং TRX ID প্রয়োজনের তথ্য দেখতে, সম্পাদনা করতে বা মুছে ফেলতে পারেন।

### **2. অ্যাডমিন প্যানেল: ডিপোজিট ও উইথড্রয়াল ব্যবস্থাপনা**

"Admin Panel" -> "Manage Deposits" এবং "Manage Withdrawals" এ গিয়ে অ্যাডমিন সকল ব্যবহারকারীর জমা এবং উত্তোলনের অনুরোধগুলো দেখতে ও পরিচালনা করতে পারেন।

*   **ডিপোজিট ব্যবস্থাপনা:**
    *   **ফিল্টারিং:** অ্যাডমিন "Pending", "Approved", "Rejected" অথবা "All" ডিপোজিটগুলো দেখতে পারবেন।
    *   **ডিপোজিট বিবরণ:** প্রতিটি ডিপোজিটের জন্য ব্যবহারকারীর ইমেল, অপশনের নাম, ডিপোজিট করা পরিমাণ, পুরস্কারের পরিমাণ, TRX ID (যদি থাকে) এবং অনুরোধের তারিখ দেখা যাবে। TRX ID যদি একটি লিঙ্ক হয়, তাহলে তা ক্লিকযোগ্য হবে।
    *   **অনুমোদন/প্রত্যাখ্যান:**
        *   **Approve (অনুমোদন):** অ্যাডমিন একটি ডিপোজিট অনুমোদন করলে, ব্যবহারকারীর অ্যাকাউন্টে ডিপোজিট করা পরিমাণ **এবং** প্রযোজ্য পুরস্কারের পরিমাণ যোগ হবে।
        *   **Reject (প্রত্যাখ্যান):** অ্যাডমিন একটি ডিপোজিট প্রত্যাখ্যান করতে পারেন।
*   **উইথড্রয়াল ব্যবস্থাপনা:**
    *   **ফিল্টারিং:** অ্যাডমিন "Pending", "Approved", "Rejected" অথবা "All" উইথড্রয়ালগুলো দেখতে পারবেন।
    *   **উইথড্রয়াল বিবরণ:** প্রতিটি উইথড্রয়ালের জন্য ব্যবহারকারীর ইমেল, অপশনের নাম, উত্তোলনের পরিমাণ, গন্তব্য ঠিকানা/আইডি এবং অনুরোধের তারিখ দেখা যাবে।
    *   **অনুমোদন/প্রত্যাখ্যান:**
        *   **Approve (অনুমোদন):** অ্যাডমিন একটি উইথড্রয়াল অনুমোদন করলে, ব্যবহারকারীর অ্যাকাউন্ট থেকে উত্তোলনের পরিমাণ কেটে নেওয়া হবে।
        *   **Reject (প্রত্যাখ্যান):** অ্যাডমিন একটি উইথড্রয়াল প্রত্যাখ্যান করতে পারেন।

### **3. বিজ্ঞাপনদাতা: তহবিল ডিপোজিট করুন**

বিজ্ঞাপনদাতারা তাদের অ্যাকাউন্টে তহবিল যোগ করতে "Advertiser Dashboard" -> "Deposit Funds" এ যেতে পারেন।

*   **ডিপোজিট অপশন নির্বাচন:** বিজ্ঞাপনদাতা উপলব্ধ ডিপোজিট অপশনগুলো থেকে একটি পদ্ধতি নির্বাচন করবেন। প্রতিটি অপশনের জন্য সর্বনিম্ন/সর্বোচ্চ পরিমাণ এবং বিবরণ দেখা যাবে।
*   **ডিপোজিট বিবরণ:** নির্বাচিত অপশনের জন্য ডিপোজিট ঠিকানা বা পেমেন্টের তথ্য প্রদর্শিত হবে।
*   **পরিমাণ ও লেনদেন আইডি ইনপুট:**
    *   বিজ্ঞাপনদাতা ডিপোজিট করার পরিমাণ ইনপুট করবেন, যা নির্বাচিত অপশনের সীমা মেনে চলতে হবে।
    *   যদি নির্বাচিত অপশনের জন্য লেনদেন আইডি/লিঙ্ক প্রয়োজন হয়, তবে সেই ইনপুট ফিল্ডটি দৃশ্যমান হবে এবং বাধ্যতামূলক হবে।
*   **পেমেন্ট সারাংশ:** ব্যবহারকারী মোট ডিপোজিট পরিমাণ এবং যদি কোনো পুরস্কার প্রযোজ্য হয়, তাহলে সেই পুরস্কারের পরিমাণ দেখতে পাবেন।
*   **ডিপোজিট অনুরোধ জমা:** ফর্মটি জমা দিলে, একটি "Pending" ডিপোজিট অনুরোধ অ্যাডমিনের কাছে যাবে।
*   **ডিপোজিট হিস্টরি:** বিজ্ঞাপনদাতারা তাদের সকল পূর্ববর্তী ডিপোজিটের স্থিতি, পরিমাণ, পুরস্কার এবং তারিখ সহ একটি তালিকা দেখতে পাবেন।

### **4. প্রকাশক: তহবিল উত্তোলন করুন**

প্রকাশকরা তাদের উপার্জিত তহবিল উত্তোলন করতে "Publisher Dashboard" -> "Withdraw Funds" এ যেতে পারেন।

*   **বর্তমান ব্যালেন্স:** প্রকাশকের বর্তমান অ্যাকাউন্ট ব্যালেন্স স্পষ্টভাবে প্রদর্শিত হবে।
*   **উইথড্রয়াল অপশন নির্বাচন:** প্রকাশক উপলব্ধ উইথড্রয়াল অপশনগুলো থেকে একটি পদ্ধতি নির্বাচন করবেন। প্রতিটি অপশনের জন্য সর্বনিম্ন/সর্বোচ্চ পরিমাণ এবং বিবরণ দেখা যাবে।
*   **পরিমাণ ও গন্তব্য ঠিকানা/আইডি ইনপুট:**
    *   প্রকাশক উত্তোলনের পরিমাণ ইনপুট করবেন, যা তাদের বর্তমান ব্যালেন্স এবং নির্বাচিত অপশনের সীমা মেনে চলতে হবে।
    *   প্রকাশককে তহবিল পাঠানোর জন্য তাদের গন্তব্য ঠিকানা বা আইডি (যেমন: ওয়ালেট ঠিকানা, ব্যাংক অ্যাকাউন্ট নম্বর) প্রদান করতে হবে।
*   **উইথড্রয়াল অনুরোধ জমা:** ফর্মটি জমা দিলে, একটি "Pending" উইথড্রয়াল অনুরোধ অ্যাডমিনের কাছে যাবে।
*   **উইথড্রয়াল হিস্টরি:** প্রকাশকরা তাদের সকল পূর্ববর্তী উইথড্রয়ালের স্থিতি, পরিমাণ, গন্তব্য এবং তারিখ সহ একটি তালিকা দেখতে পাবেন।

---

## Firebase Realtime Database সিকিউরিটি রুলস (গুরুত্বপূর্ণ!)

আপনার `firebase.rules` ফাইলে নিম্নলিখিত বেসিক রুলস যোগ করতে পারেন। এটি নিশ্চিত করবে যে শুধুমাত্র প্রমাণীকৃত ব্যবহারকারীরা ডেটা রিড/রাইট করতে পারবে এবং `/users`, `/admin`, `/deposits` এবং `/withdrawals` নোডগুলো সুরক্ষিত থাকবে।

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid || root.child('users').child(auth.uid).child('role').val() === 'admin'",
        ".write": "auth != null && auth.child('uid').val() == $uid || root.child('users').child(auth.child('uid').val()).child('role').val() === 'admin'"
      }
    },
    "campaigns": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.child('uid').val()).child('role').val() === 'advertiser'"
    },
    "publisherApps": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.child('uid').val()).child('role').val() === 'publisher'"
    },
    "deposits": {
      // Users can read their own deposits, admin can read all
      ".read": "auth != null && (root.child('users').child(auth.child('uid').val()).child('role').val() === 'admin' || data.child('userId').val() === auth.child('uid').val())",
      // Users can only write their own *new* deposit requests (status pending)
      // Admin can update status
      "$depositId": {
        ".write": "auth != null && (root.child('users').child(auth.child('uid').val()).child('role').val() === 'admin' || (newData.child('userId').val() === auth.child('uid').val() && newData.child('status').val() === 'pending'))"
      }
    },
    "withdrawals": {
      // Users can read their own withdrawals, admin can read all
      ".read": "auth != null && (root.child('users').child(auth.child('uid').val()).child('role').val() === 'admin' || data.child('userId').val() === auth.child('uid').val())",
      // Users can only write their own *new* withdrawal requests (status pending)
      // Admin can update status
      "$withdrawalId": {
        ".write": "auth != null && (root.child('users').child(auth.child('uid').val()).child('role').val() === 'admin' || (newData.child('userId').val() === auth.child('uid').val() && newData.child('status').val() === 'pending'))"
      }
    },
    "admin": {
      ".read": "auth != null && root.child('users').child(auth.child('uid').val()).child('role').val() === 'admin'",
      ".write": "auth != null && root.child('users').child(auth.child('uid').val()).child('role').val() === 'admin'"
    },
    ".read": false,
    ".write": false
  }
}
```
**গুরুত্বপূর্ণ নোট:** এই রুলসগুলো একটি বেসিক স্টার্টিং পয়েন্ট। প্রোডাকশন অ্যাপ্লিকেশনের জন্য আপনার ডেটার কাঠামো এবং সুরক্ষার প্রয়োজন অনুযায়ী এগুলোকে আরও কঠোরভাবে কাস্টমাইজ করতে হবে। উদাহরণস্বরূপ, `/admin` নোডগুলিতে শুধু অ্যাডমিন অ্যাক্সেস আছে তা নিশ্চিত করা হয়েছে।

## হোস্টিং পরবর্তী পদক্ষেপ

আপনার ফাইল আপলোড এবং `.htaccess` কনফিগারেশন সম্পন্ন হলে, আপনার ওয়েবসাইটটি ব্রাউজারে লোড করা উচিত।

*   **URL:** আপনার ডোমেইন নেম (`yourdomain.com`) বা সাবডোমেইন নেম (`sub.yourdomain.com`) ব্যবহার করে ওয়েবসাইটে যান।
*   **রাউটিং:** Angular hash location strategy ব্যবহার করছে (`yourdomain.com/#/admin`) তাই URL এ `#` থাকবে।
*   **অ্যাডমিন প্যানেল:** `yourdomain.com/#/admin` এ নেভিগেট করুন এবং আপনার `abcoinseo@gmail.com` ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করার চেষ্টা করুন।

এই ধাপগুলি অনুসরণ করে আপনি আপনার AdsBitvex Angular অ্যাপ্লিকেশনটি cPanel হোস্টিং পরিবেশে সফলভাবে স্থাপন করতে পারবেন এবং নতুন ডিপোজিট ও উইথড্রয়াল সিস্টেমের সুবিধা উপভোগ করতে পারবেন।PS C:\Users\ABSIDDIK\Desktop\adsbitvex---ad-network> npm run build

> adsbitvex---ad-network@0.0.0 build
> ng build


Would you like to share pseudonymous usage data about this project with the Angular Team
at Google under Google's Privacy Policy at https://policies.google.com/privacy. For more
details and how to change this setting, see https://angular.dev/cli/analytics.

   Yes

Thank you for sharing pseudonymous usage data. Should you change your mind, the following
command will disable this feature entirely:

    ng analytics disable

Global setting: not set
Local setting: enabled
Effective status: enabled
Application bundle generation failed. [8.211 seconds] - 2025-11-15T15:18:34.536Z

X [ERROR] NG5002: Parser Error: Bindings cannot contain assignments at column 28 in [ allDeposits().filter(dep 
=> dep.status === 'pending').length ] in C:\Users\ABSIDDIK\Desktop\adsbitvex---ad-network\src\components\admin\manage-deposits\manage-deposits.component.html@23:17 [plugin angular-compiler]

    src/components/admin/manage-deposits/manage-deposits.component.html:24:17:
      24 │ ... Pending ({{ allDeposits().filter(dep => dep.status === 'pendin...
         ╵              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  Error occurs in the template of component ManageDepositsComponent.

    src/components/admin/manage-deposits/manage-deposits.component.ts:11:15:
      11 │   templateUrl: './manage-deposits.component.html',
         ╵                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


X [ERROR] NG5002: Parser Error: Bindings cannot contain assignments at column 28 in [ allDeposits().filter(dep 
=> dep.status === 'approved').length ] in C:\Users\ABSIDDIK\Desktop\adsbitvex---ad-network\src\components\admin\manage-deposits\manage-deposits.component.html@30:18 [plugin angular-compiler]

    src/components/admin/manage-deposits/manage-deposits.component.html:31:18:
      31 │ ...Approved ({{ allDeposits().filter(dep => dep.status === 'approv...
         ╵              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  Error occurs in the template of component ManageDepositsComponent.

    src/components/admin/manage-deposits/manage-deposits.component.ts:11:15:
      11 │   templateUrl: './manage-deposits.component.html',
         ╵                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


X [ERROR] NG5002: Parser Error: Bindings cannot contain assignments at column 28 in [ allDeposits().filter(dep 
=> dep.status === 'rejected').length ] in C:\Users\ABSIDDIK\Desktop\adsbitvex---ad-network\src\components\admin\manage-deposits\manage-deposits.component.html@37:18 [plugin angular-compiler]

    src/components/admin/manage-deposits/manage-deposits.component.html:38:18:
      38 │ ...Rejected ({{ allDeposits().filter(dep => dep.status === 'reject...
         ╵              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  Error occurs in the template of component ManageDepositsComponent.

    src/components/admin/manage-deposits/manage-deposits.component.ts:11:15:
      11 │   templateUrl: './manage-deposits.component.html',
         ╵                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


X [ERROR] NG5002: Parser Error: Bindings cannot contain assignments at column 30 in [ allWithdrawals().filter(wd => wd.status === 'pending').length ] in C:\Users\ABSIDDIK\Desktop\adsbitvex---ad-network\src\components\admin\manage-withdrawals\manage-withdrawals.component.html@23:17 [plugin angular-compiler]

    src/components/admin/manage-withdrawals/manage-withdrawals.component.html:24:17:
      24 │ ... Pending ({{ allWithdrawals().filter(wd => wd.status === 'pendi...
         ╵              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  Error occurs in the template of component ManageWithdrawalsComponent.

    src/components/admin/manage-withdrawals/manage-withdrawals.component.ts:11:15:
      11 │   templateUrl: './manage-withdrawals.component.html',
         ╵                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


X [ERROR] NG5002: Parser Error: Bindings cannot contain assignments at column 30 in [ allWithdrawals().filter(wd => wd.status === 'approved').length ] in C:\Users\ABSIDDIK\Desktop\adsbitvex---ad-network\src\components\admin\manage-withdrawals\manage-withdrawals.component.html@30:18 [plugin angular-compiler]

    src/components/admin/manage-withdrawals/manage-withdrawals.component.html:31:18:
      31 │ ...Approved ({{ allWithdrawals().filter(wd => wd.status === 'appro...
         ╵              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  Error occurs in the template of component ManageWithdrawalsComponent.

    src/components/admin/manage-withdrawals/manage-withdrawals.component.ts:11:15:
      11 │   templateUrl: './manage-withdrawals.component.html',
         ╵                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


X [ERROR] NG5002: Parser Error: Bindings cannot contain assignments at column 30 in [ allWithdrawals().filter(wd => wd.status === 'rejected').length ] in C:\Users\ABSIDDIK\Desktop\adsbitvex---ad-network\src\components\admin\manage-withdrawals\manage-withdrawals.component.html@37:18 [plugin angular-compiler]

    src/components/admin/manage-withdrawals/manage-withdrawals.component.html:38:18:
      38 │ ...Rejected ({{ allWithdrawals().filter(wd => wd.status === 'rejec...
         ╵              ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  Error occurs in the template of component ManageWithdrawalsComponent.

    src/components/admin/manage-withdrawals/manage-withdrawals.component.ts:11:15:
      11 │   templateUrl: './manage-withdrawals.component.html',
         ╵                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


X [ERROR] NG2008: Could not find stylesheet file './advertiser.dashboard.component.css'. [plugin angular-compiler]

    src/components/advertiser/advertiser-dashboard/advertiser-dashboard.component.ts:16:12:
      16 │   styleUrl: './advertiser.dashboard.component.css',
         ╵             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


X [ERROR] TS2307: Cannot find module 'firebase/database' or its corresponding type declarations. [plugin angular-compiler]

    src/components/shared/navbar/admin.service.ts:6:29:
      6 │ import { DataSnapshot } from 'firebase/database';
        ╵                              ~~~~~~~~~~~~~~~~~~~


X [ERROR] TS2307: Cannot find module 'firebase/app' or its corresponding type declarations. [plugin angular-compiler]

    src/firebase-config.ts:2:43:
      2 │ import { initializeApp, FirebaseApp } from 'firebase/app';
        ╵                                            ~~~~~~~~~~~~~~


X [ERROR] TS2307: Cannot find module 'firebase/database' or its corresponding type declarations. [plugin angular-compiler]

    src/firebase-config.ts:3:46:
      3 │ import { getDatabase, FirebaseDatabase } from 'firebase/database';
        ╵                                               ~~~~~~~~~~~~~~~~~~~


X [ERROR] TS2307: Cannot find module 'firebase/auth' or its corresponding type declarations. [plugin angular-compiler]

    src/firebase-config.ts:4:30:
      4 │ ...t { getAuth, Auth } from 'firebase/auth'; // Changed FirebaseAut...
        ╵                             ~~~~~~~~~~~~~~~


X [ERROR] TS2559: Type 'ProcessEnv' has no properties in common with type 'FirebaseEnv'. [plugin angular-compiler]

    src/firebase-config.ts:19:6:
      19 │ const env: FirebaseEnv = typeof process !== 'undefined' && process...
         ╵       ~~~


X [ERROR] TS2307: Cannot find module 'firebase/database' or its corresponding type declarations. [plugin angular-compiler]

    src/services/app.service.ts:6:29:
      6 │ import { DataSnapshot } from 'firebase/database';
        ╵                              ~~~~~~~~~~~~~~~~~~~


X [ERROR] TS2307: Cannot find module 'firebase/auth' or its corresponding type declarations. [plugin angular-compiler]

    src/services/auth.service.ts:11:7:
      11 │ } from 'firebase/auth';
         ╵        ~~~~~~~~~~~~~~~


X [ERROR] TS2307: Cannot find module 'firebase/database' or its corresponding type declarations. [plugin angular-compiler]

    src/services/auth.service.ts:12:40:
      12 │ import { Database, ref, set, get } from 'firebase/database';
         ╵                                         ~~~~~~~~~~~~~~~~~~~


X [ERROR] TS2307: Cannot find module 'firebase/database' or its corresponding type declarations. [plugin angular-compiler]

    src/services/campaign.service.ts:5:29:
      5 │ import { DataSnapshot } from 'firebase/database';
        ╵                              ~~~~~~~~~~~~~~~~~~~


X [ERROR] TS2307: Cannot find module 'firebase/database' or its corresponding type declarations. [plugin angular-compiler]

    src/services/data.service.ts:3:85:
      3 │ ...te, remove, push, onValue, DataSnapshot } from 'firebase/database';
        ╵                                                   ~~~~~~~~~~~~~~~~~~~


X [ERROR] Could not resolve "firebase/app"

    src/firebase-config.ts:2:43:
      2 │ import { initializeApp, FirebaseApp } from 'firebase/app';
        ╵                                            ~~~~~~~~~~~~~~

  You can mark the path "firebase/app" as external to exclude it from the bundle, which will remove this error 
and leave the unresolved path in the bundle.


X [ERROR] Could not resolve "firebase/database"

    src/firebase-config.ts:3:46:
      3 │ import { getDatabase, FirebaseDatabase } from 'firebase/database';
        ╵                                               ~~~~~~~~~~~~~~~~~~~

  You can mark the path "firebase/database" as external to exclude it from the bundle, which will remove this error and leave the unresolved path in the bundle.


X [ERROR] Could not resolve "firebase/auth"

    src/firebase-config.ts:4:30:
      4 │ ...t { getAuth, Auth } from 'firebase/auth'; // Changed FirebaseAut...
        ╵                             ~~~~~~~~~~~~~~~

  You can mark the path "firebase/auth" as external to exclude it from the bundle, which will remove this error and leave the unresolved path in the bundle.


X [ERROR] Could not resolve "firebase/auth"

    src/services/auth.service.ts:2:160:
      2 │ ... setPersistence, browserSessionPersistence, } from 'firebase/auth';
        ╵                                                       ~~~~~~~~~~~~~~~

  You can mark the path "firebase/auth" as external to exclude it from the bundle, which will remove this error and leave the unresolved path in the bundle.


X [ERROR] Could not resolve "firebase/database"

    src/services/auth.service.ts:3:40:
      3 │ import { Database, ref, set, get } from 'firebase/database';
        ╵                                         ~~~~~~~~~~~~~~~~~~~

  You can mark the path "firebase/database" as external to exclude it from the bundle, which will remove this error and leave the unresolved path in the bundle.


X [ERROR] Could not resolve "firebase/database"

    src/services/data.service.ts:2:85:
      2 │ ...te, remove, push, onValue, DataSnapshot } from 'firebase/database';
        ╵                                                   ~~~~~~~~~~~~~~~~~~~

  You can mark the path "firebase/database" as external to exclude it from the bundle, which will remove this error and leave the unresolved path in the bundle.
   bangla explain how to fux