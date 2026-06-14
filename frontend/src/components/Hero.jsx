const Hero = ({ onSOSClick }) => {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          <div>
            <span className="px-4 py-2 rounded-full bg-pink-100 text-pink-600 font-medium">
              Women Safety Platform
            </span>

            <h1 className="mt-6 text-6xl font-bold leading-tight text-slate-900">
              Your Safety.
              <br />
              Your Voice.
              <br />
              <span className="text-pink-600">
                Your Strength.
              </span>
            </h1>

            <p className="mt-6 text-lg text-slate-600">
              Real-time SOS assistance, live location tracking,
              emergency evidence recording and NGO support.
            </p>

            <div className="mt-8 flex gap-4">
              <button
                onClick={onSOSClick}
                className="bg-pink-600 text-white px-8 py-4 rounded-xl"
              >
                SOS Emergency
              </button>

              <button className="border px-8 py-4 rounded-xl">
                Learn More
              </button>
            </div>
          </div>

          <div>
            <img
              src="/hero-woman.png"
              alt="Voice of Her"
              className="w-full"
            />
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;