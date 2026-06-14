import GlassCard from "../ui/GlassCard";

const SOSButtonCard = ({ onClick }) => {
  return (
    <GlassCard className="p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Feeling Unsafe?</h2>

        <p className="text-gray-400 mb-10">
          Press the SOS button to instantly alert your trusted contacts and
          admin.
        </p>

        <button
          onClick={onClick}
          className="
            w-56
            h-56
            rounded-full
            bg-red-600
            text-white
            text-3xl
            font-bold
            shadow-lg
            hover:scale-105
            transition
          "
        >
          SOS
        </button>

        <div className="grid md:grid-cols-3 gap-4 mt-10">

          <button className="bg-white border rounded-xl p-4">
            Silent SOS
          </button>

          <button className="bg-white border rounded-xl p-4">
            Call Emergency
          </button>

          <button className="bg-white border rounded-xl p-4">
            Record Evidence
          </button>

        </div>
      </div>
    </GlassCard>
  );
};

export default SOSButtonCard;
