"use client";
import { useRouter, usePathname } from "next/navigation";
import { C } from "@/utils/constants";
import { HomeIc, StoreIc, LiveIc, UserIc, PlayIc } from "@/components/ui/icons";

const tabs = [
  { id: "home",     label: "Home",     path: "/" },
  { id: "stores",   label: "Stores",   path: "/stores" },
  { id: "discover", label: "Discover", path: "/discover", fab: true },
  { id: "live",     label: "Live",     path: "/live" },
  { id: "profile",  label: "Profile",  path: "/profile" },
];

export default function BottomNav() {
  const router   = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/" ) return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430,
      background: C.white, borderTop: `1px solid ${C.border}`,
      display: "flex", alignItems: "flex-end",
      zIndex: 500, height: 70, paddingBottom: 6
    }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => router.push(t.path)}
          style={{
            flex: 1, background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "flex-end",
            gap: 3, height: "100%", paddingBottom: 0
          }}
        >
          {t.fab ? (
            <>
              <div style={{
                width: 54, height: 54, borderRadius: "50%",
                background: `linear-gradient(145deg,#FF6B3D,${C.primary})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 4px 16px ${C.primary}60`,
                transform: "translateY(-10px)"
              }}>
                <PlayIc sz={22} />
              </div>
              <span style={{
                fontSize: 10,
                color: isActive(t.path) ? C.primary : C.gray,
                fontWeight: isActive(t.path) ? 700 : 400,
                marginTop: -12
              }}>{t.label}</span>
            </>
          ) : (
            <>
              {t.id === "home"    && <HomeIc  a={isActive(t.path)} />}
              {t.id === "stores"  && <StoreIc a={isActive(t.path)} />}
              {t.id === "live"    && <LiveIc  a={isActive(t.path)} />}
              {t.id === "profile" && <UserIc  a={isActive(t.path)} />}
              <span style={{
                fontSize: 10,
                color: isActive(t.path) ? C.primary : C.gray,
                fontWeight: isActive(t.path) ? 700 : 400
              }}>{t.label}</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}
