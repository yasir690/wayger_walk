const emailTemplates = {
    register: (OTP) => `
        <div
          style="padding:20px 20px 40px 20px; position: relative; overflow: hidden; width: 100%;"
        >
          <div style="z-index:1; position: relative;">
          <header style="padding-bottom: 20px">
            <div class="logo" style="text-align:center;">
            </div>
          </header>
          <main
            style="padding: 20px; background-color: #f5f5f5; border-radius: 10px; width: 80%; margin: 0 auto; margin-bottom: 20px; font-family: 'Poppins', sans-serif;"
          >
            <h1
              style="color: #fd6835; font-size: 30px; font-weight: 700;"
            >Welcome To Wayger Walk</h1>
            <p
              style="font-size: 24px; text-align: left; font-weight: 500; font-style: italic;"
            >Hi,</p>
            <p
              style="font-size: 20px; text-align: left; font-weight: 500;"
            >Thank you for registering with us. Please use the following OTP to verify your email address.</p>
            <h2
              style="font-size: 36px; font-weight: 700; padding: 10px; width:100%; text-align:center;color: #fd6835; text-align: center; margin-top: 20px; margin-bottom: 20px;"
            >${OTP}</h2>
            <p style="font-size: 16px; font-style:italic; color: #343434">If you did not request this email, kindly ignore this. If this is a frequent occurrence, <a
            style="color: #a87628; text-decoration: none; border-bottom: 1px solid #a87628;" href="#"
            >let us know.</a></p>
            <p style="font-size: 20px;">Regards,</p>
            <p style="font-size: 20px;">Dev Team</p>
          </main>
          </div>
        <div>
      `,
  
    forgetPassword: (OTP) => `
        <div
          style="padding:20px 20px 40px 20px; position: relative; overflow: hidden; width: 100%;"
        >
          <div style="z-index:1; position: relative;">
          <header style="padding-bottom: 20px">
            <div class="logo" style="text-align:center;">
            </div>
          </header>
          <main
            style="padding: 20px; background-color: #f5f5f5; border-radius: 10px; width: 80%; margin: 0 auto; margin-bottom: 20px; font-family: 'Poppins', sans-serif;"
          >
            <h1
              style="color: #fd6835; font-size: 30px; font-weight: 700;"
            >Welcome To Wayger Walk</h1>
            <p
              style="font-size: 24px; text-align: left; font-weight: 500; font-style: italic;"
            >Hi,</p>
            <p
              style="font-size: 20px; text-align: left; font-weight: 500;"
            >We received a request to reset your password. Please use the following OTP to reset your password.</p>
            <h2
              style="font-size: 36px; font-weight: 700; padding: 10px; width:100%; text-align:center;color: #fd6835; text-align: center; margin-top: 20px; margin-bottom: 20px;"
            >${OTP}</h2>
            <p style="font-size: 16px; font-style:italic; color: #343434">If you did not request this email, kindly ignore this. If this is a frequent occurrence, <a
            style="color: #a87628; text-decoration: none; border-bottom: 1px solid #a87628;" href="#"
            >let us know.</a></p>
            <p style="font-size: 20px;">Regards,</p>
            <p style="font-size: 20px;">Dev Team</p>
          </main>
          </div>
        <div>
      `,
  
      resendOTP: (OTP) => `
      <div
        style="padding:20px 20px 40px 20px; position: relative; overflow: hidden; width: 100%;"
      >
        <div style="z-index:1; position: relative;">
        <header style="padding-bottom: 20px">
          <div class="logo" style="text-align:center;">
          </div>
        </header>
        <main
          style="padding: 20px; background-color: #f5f5f5; border-radius: 10px; width: 80%; margin: 0 auto; margin-bottom: 20px; font-family: 'Poppins', sans-serif;"
        >
          <h1
            style="color: #fd6835; font-size: 30px; font-weight: 700;"
          >Welcome To Wayger Walk</h1>
          <p
            style="font-size: 24px; text-align: left; font-weight: 500; font-style: italic;"
          >Hi,</p>
          <p
            style="font-size: 20px; text-align: left; font-weight: 500;"
          >Please use the following OTP to verify your email address.</p>
          <h2
            style="font-size: 36px; font-weight: 700; padding: 10px; width:100%; text-align:center;color: #fd6835; text-align: center; margin-top: 20px; margin-bottom: 20px;"
          >${OTP}</h2>
          <p style="font-size: 16px; font-style:italic; color: #343434">If you did not request this email, kindly ignore this. If this is a frequent occurrence, <a
          style="color: #a87628; text-decoration: none; border-bottom: 1px solid #a87628;" href="#"
          >let us know.</a></p>
          <p style="font-size: 20px;">Regards,</p>
          <p style="font-size: 20px;">Dev Team</p>
        </main>
        </div>
      <div>
    `,

     Login: (OTP) => `
      <div
        style="padding:20px 20px 40px 20px; position: relative; overflow: hidden; width: 100%;"
      >
        <div style="z-index:1; position: relative;">
        <header style="padding-bottom: 20px">
          <div class="logo" style="text-align:center;">
          </div>
        </header>
        <main
          style="padding: 20px; background-color: #f5f5f5; border-radius: 10px; width: 80%; margin: 0 auto; margin-bottom: 20px; font-family: 'Poppins', sans-serif;"
        >
          <h1
            style="color: #fd6835; font-size: 30px; font-weight: 700;"
          >Welcome To Wayger Walk</h1>
          <p
            style="font-size: 24px; text-align: left; font-weight: 500; font-style: italic;"
          >Hi,</p>
          <p
            style="font-size: 20px; text-align: left; font-weight: 500;"
          >Please use the following OTP to verify your email address.</p>
          <h2
            style="font-size: 36px; font-weight: 700; padding: 10px; width:100%; text-align:center;color: #fd6835; text-align: center; margin-top: 20px; margin-bottom: 20px;"
          >${OTP}</h2>
          <p style="font-size: 16px; font-style:italic; color: #343434">If you did not request this email, kindly ignore this. If this is a frequent occurrence, <a
          style="color: #a87628; text-decoration: none; border-bottom: 1px solid #a87628;" href="#"
          >let us know.</a></p>
          <p style="font-size: 20px;">Regards,</p>
          <p style="font-size: 20px;">Dev Team</p>
        </main>
        </div>
      <div>
    `,
  };
  
  module.exports = emailTemplates;
  