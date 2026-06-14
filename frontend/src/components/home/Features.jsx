import {
  ShieldAlert,
  HeartPulse,
  GraduationCap,
  Users,
} from "lucide-react";

const features = [
  {
    title: "SOS Protection",
    icon: ShieldAlert,
  },
  {
    title: "Health Support",
    icon: HeartPulse,
  },
  {
    title: "Career & Education",
    icon: GraduationCap,
  },
  {
    title: "Community Support",
    icon: Users,
  },
];

export default function Features() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-4xl font-bold text-center">
          Everything You Need
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-14">

          {features.map((feature) => (
            <div
              key={feature.title}
              className="
                bg-white
                p-8
                rounded-2xl
                shadow-sm
                border
              "
            >
              <feature.icon
                className="text-pink-600"
                size={40}
              />

              <h3 className="mt-4 font-semibold text-lg">
                {feature.title}
              </h3>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
