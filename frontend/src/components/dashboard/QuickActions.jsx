import {
    ShieldAlert,
    MapPin,
    GraduationCap,
    User,
} from "lucide-react";

export default function QuickActions() {
    const actions = [
        {
            title: "SOS Center",
            icon: ShieldAlert,
        },
        {
            title: "Live Tracking",
            icon: MapPin,
        },
        {
            title: "Empower Hub",
            icon: GraduationCap,
        },
        {
            title: "Profile",
            icon: User,
        },
    ];

    return (
        <div className="grid md:grid-cols-4 gap-6">
            {actions.map((item) => (
                <div
                    key={item.title}
                    className="
            bg-white
            rounded-2xl
            p-6
            shadow-sm
            border
          "
                >
                    <item.icon
                        className="text-pink-600 mb-4"
                        size={30}
                    />

                    <h3 className="font-semibold">
                        {item.title}
                    </h3>
                </div>
            ))}
        </div>
    );
}