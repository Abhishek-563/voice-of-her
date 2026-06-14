import { Shield, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-24">

        <div className="grid lg:grid-cols-2 gap-12 items-center">

          <div>

            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="
                inline-flex
                px-4
                py-2
                rounded-full
                bg-pink-100
                text-pink-600
                font-medium
              "
            >
              Women's Safety Platform
            </motion.span>

            <h1
              className="
                mt-6
                text-5xl
                lg:text-7xl
                font-bold
                text-slate-900
                leading-tight
              "
            >
              Your Safety.
              <br />
              Your Voice.
              <br />
              <span className="text-pink-600">
                Your Strength.
              </span>
            </h1>

            <p className="mt-6 text-lg text-slate-600">
              Emergency SOS assistance, live tracking,
              evidence recording and NGO support
              in one secure platform.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">

              <button
                className="
                  bg-pink-600
                  hover:bg-pink-700
                  text-white
                  px-8
                  py-4
                  rounded-xl
                  font-semibold
                "
              >
                Emergency SOS
              </button>

              <button
                className="
                  border
                  border-slate-300
                  px-8
                  py-4
                  rounded-xl
                "
              >
                Learn More
              </button>

            </div>

            <div className="mt-10 flex gap-8">

              <div className="flex items-center gap-2">
                <Shield size={18} />
                <span>24/7 Protection</span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin size={18} />
                <span>Live Tracking</span>
              </div>

            </div>

          </div>

          <div>

            <img
              src="/hero-image.png"
              alt="Voice Of Her"
              className="w-full"
            />

          </div>

        </div>

      </div>
    </section>
  );
}
