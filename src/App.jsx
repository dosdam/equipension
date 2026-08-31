import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Home,
  Users,
  ShieldCheck,
  History,
  Plus,
  Search,
  ChevronLeft,
  Camera,
  MapPin,
  HeartPulse,
  Edit3,
  Check,
  X,
  Bell,
  UserRound,
  Clock3,
  Link2,
  Cloud,
  CloudOff,
  LoaderCircle,
} from "lucide-react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db, configured } from "./firebase";
const initialHorses = [
  {
    id: "h1",
    name: "Opale des Prés",
    sex: "Jument",
    breed: "Selle Français",
    birth: "2015-04-18",
    arrival: "2024-09-02",
    box: "Écurie A • Box 04",
    photo:
      "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200&q=80",
    diet: "Foin à volonté, sans avoine. CMV matin et soir.",
    vaccine: "2026-05-14",
    status: "Présente",
    owners: ["Camille Bernard"],
    halfBoarders: ["Léa Martin"],
    outings: [],
    care: [
      {
        id: "c1",
        date: "2026-08-27",
        type: "Maréchalerie",
        note: "Parage et ferrure antérieure",
        by: "Admin Écurie",
      },
    ],
  },
  {
    id: "h2",
    name: "Jazz du Vallon",
    sex: "Hongre",
    breed: "Trotteur Français",
    birth: "2017-02-08",
    arrival: "2025-01-15",
    box: "Pré Nord",
    photo:
      "https://images.unsplash.com/photo-1566251037378-5e04e3bec343?auto=format&fit=crop&w=1200&q=80",
    diet: "2 L granulés matin et soir. Foin humidifié.",
    vaccine: "2026-02-09",
    status: "En sortie",
    owners: ["Thomas Leroy"],
    halfBoarders: [],
    outings: [
      {
        id: "o1",
        place: "Concours CSO Metz",
        date: "2026-08-31",
        duration: "Journée",
        by: "Thomas Leroy",
      },
    ],
    care: [],
  },
];
const initialRiders = [
  {
    id: "r1",
    name: "Camille Bernard",
    email: "camille@example.fr",
    phone: "06 12 34 56 78",
    links: [{ horseId: "h1", type: "Propriétaire" }],
  },
  {
    id: "r2",
    name: "Léa Martin",
    email: "lea@example.fr",
    phone: "06 23 45 67 89",
    links: [{ horseId: "h1", type: "Demi-pension" }],
  },
  {
    id: "r3",
    name: "Thomas Leroy",
    email: "thomas@example.fr",
    phone: "06 34 56 78 90",
    links: [{ horseId: "h2", type: "Propriétaire" }],
  },
];
const initialAudit = [
  {
    id: 1,
    at: "31/08/2026 • 10:42",
    user: "Admin Écurie",
    action: "Sortie signalée",
    subject: "Jazz du Vallon",
    detail: "Concours CSO Metz • Journée",
  },
];
const initialPermissions = {
  r1: { h1: "lecture" },
  r2: { h1: "modification" },
  r3: { h2: "modification" },
};
const firebaseErrorText = (e) => {
  const code = e?.code || "";
  const map = {
    "permission-denied": "Permission refusee par les regles Firestore",
    unauthenticated: "Connexion requise",
    "auth/invalid-credential": "Identifiants invalides",
    "auth/user-not-found": "Utilisateur introuvable",
    "auth/wrong-password": "Mot de passe incorrect",
    "auth/email-already-in-use": "Email deja utilise",
    "auth/weak-password": "Mot de passe trop faible",
    "auth/popup-closed-by-user": "Popup fermee avant connexion",
  };
  return map[code] || e?.message || "Erreur Firebase";
};
const ref = db ? doc(db, "pensions", "haras-des-vallons") : null;
const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((x) => x.trim().toLowerCase())
  .filter(Boolean);
const fmt = (d) =>
  d
    ? new Intl.DateTimeFormat("fr-FR").format(new Date(d + "T12:00:00"))
    : "Non renseignée";
const input =
  "w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
function Pill({ children, tone = "green" }) {
  const t = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-sky-50 text-sky-700",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${t[tone]}`}>
      {children}
    </span>
  );
}
function HorseIcon({ size = 20 }) {
  return (
    <span aria-hidden="true" style={{ fontSize: size, lineHeight: 1 }}>
      🐴
    </span>
  );
}
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/45 sm:items-center sm:p-5">
      <div className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-5 py-4">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-full bg-slate-100 p-2">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
export default function App() {
  const [tab, setTab] = useState("home"),
    [horses, setHorses] = useState(initialHorses),
    [riders, setRiders] = useState(initialRiders),
    [audit, setAudit] = useState(initialAudit),
    [permissions, setPermissions] = useState(initialPermissions),
    [selectedHorse, setSelectedHorse] = useState(null),
    [modal, setModal] = useState(null),
    [query, setQuery] = useState(""),
    [toast, setToast] = useState(""),
    [cloud, setCloud] = useState(configured ? "auth-required" : "unconfigured");
  const hydrated = useRef(false),
    last = useRef("");
  const [userReady, setUserReady] = useState(!configured),
    [currentUser, setCurrentUser] = useState(null),
    [authEmail, setAuthEmail] = useState(""),
    [authPassword, setAuthPassword] = useState(""),
    [authBusy, setAuthBusy] = useState(false),
    [authMessage, setAuthMessage] = useState(""),
    [cloudDetail, setCloudDetail] = useState(""),
    [adminRiderId, setAdminRiderId] = useState(""),
    [adminUserEmail, setAdminUserEmail] = useState(""),
    [adminHorseId, setAdminHorseId] = useState(""),
    [adminRole, setAdminRole] = useState("Propriétaire"),
    [adminMessage, setAdminMessage] = useState(""),
    [editHorseId, setEditHorseId] = useState(null),
    [editRiderId, setEditRiderId] = useState(null);
  useEffect(() => {
    if (!auth) {
      setUserReady(true);
      return;
    }
    const unsub = onAuthStateChanged(
      auth,
      (u) => {
        if (u) {
          setCurrentUser(u);
          setUserReady(true);
          setCloud("loading");
          setCloudDetail("");
          setAuthBusy(false);
          setAuthMessage("");
          return;
        }
        setCurrentUser(null);
        setUserReady(false);
        setCloud("auth-required");
        setCloudDetail("");
        setAuthBusy(false);
      },
      (e) => {
        console.error("Firebase auth state error", e);
        setCloud("error");
        setCloudDetail(firebaseErrorText(e));
        setAuthBusy(false);
        setAuthMessage(firebaseErrorText(e));
      },
    );
    return unsub;
  }, []);
  useEffect(() => {
    if (!configured || !currentUser) return;
    const email = (currentUser.email || "").trim().toLowerCase(),
      admin = adminEmails.includes(email),
      rider = riders.find(
        (r) => (r.email || "").trim().toLowerCase() === email,
      ),
      linked = Boolean(
        rider && Array.isArray(rider.links) && rider.links.length > 0,
      ),
      canAccess = admin || linked;
    if (!canAccess) {
      setCloud("forbidden");
      return;
    }
    if (cloud === "forbidden") setCloud("loading");
  }, [configured, currentUser, riders]);
  useEffect(() => {
    if (!ref || !userReady) return;
    const email = (currentUser?.email || "").trim().toLowerCase(),
      admin = adminEmails.includes(email),
      rider = riders.find(
        (r) => (r.email || "").trim().toLowerCase() === email,
      ),
      linked = Boolean(
        rider && Array.isArray(rider.links) && rider.links.length > 0,
      ),
      canAccess = admin || linked;
    if (!canAccess) return;
    return onSnapshot(
      ref,
      async (s) => {
        if (!s.exists()) {
          await setDoc(ref, {
            horses: initialHorses,
            riders: initialRiders,
            audit: initialAudit,
            permissions: initialPermissions,
          });
          return;
        }
        const d = s.data(),
          n = {
            horses: d.horses || [],
            riders: d.riders || [],
            audit: d.audit || [],
            permissions: d.permissions || {},
          };
        last.current = JSON.stringify(n);
        setHorses(n.horses);
        setRiders(n.riders);
        setAudit(n.audit);
        setPermissions(n.permissions);
        hydrated.current = true;
        setCloud(s.metadata.hasPendingWrites ? "saving" : "synced");
        setCloudDetail("");
      },
      (e) => {
        console.error("Firestore read error", e);
        setCloud("error");
        setCloudDetail(firebaseErrorText(e));
      },
    );
  }, [userReady, currentUser, riders]);
  useEffect(() => {
    if (!ref || !hydrated.current || !userReady) return;
    const email = (currentUser?.email || "").trim().toLowerCase(),
      admin = adminEmails.includes(email),
      rider = riders.find(
        (r) => (r.email || "").trim().toLowerCase() === email,
      ),
      linked = Boolean(
        rider && Array.isArray(rider.links) && rider.links.length > 0,
      ),
      canAccess = admin || linked;
    if (!canAccess) return;
    const p = { horses, riders, audit, permissions },
      s = JSON.stringify(p);
    if (s === last.current) return;
    setCloud("saving");
    const timer = setTimeout(
      () =>
        setDoc(ref, p)
          .then(() => {
            last.current = s;
            setCloud("synced");
            setCloudDetail("");
          })
          .catch((e) => {
            console.error("Firestore write error", e);
            setCloud("error");
            setCloudDetail(firebaseErrorText(e));
          }),
      450,
    );
    return () => clearTimeout(timer);
  }, [horses, riders, audit, permissions, userReady, currentUser]);
  const notify = (m) => {
      setToast(m);
      setTimeout(() => setToast(""), 2200);
    },
    log = (action, subject, detail) =>
      setAudit((a) => [
        {
          id: Date.now(),
          at: new Date().toLocaleString("fr-FR"),
          user: "Admin Écurie",
          action,
          subject,
          detail,
        },
        ...a,
      ]),
    selected = horses.find((h) => h.id === selectedHorse),
    filtered = useMemo(
      () =>
        horses.filter((h) =>
          `${h.name} ${h.nickname || ""} ${h.breed} ${h.box}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
      [horses, query],
    );
  const currentRider = useMemo(() => {
    const email = (currentUser?.email || "").trim().toLowerCase();
    if (!email) return null;
    return (
      riders.find((r) => (r.email || "").trim().toLowerCase() === email) || null
    );
  }, [riders, currentUser]);
  const horseToEdit = useMemo(
    () => horses.find((h) => h.id === editHorseId) || null,
    [horses, editHorseId],
  );
  const riderToEdit = useMemo(
    () => riders.find((r) => r.id === editRiderId) || null,
    [riders, editRiderId],
  );
  const hasRiderLink = Boolean(
    currentRider &&
    Array.isArray(currentRider.links) &&
    currentRider.links.length > 0,
  );
  const isAdmin = Boolean(
    currentUser &&
    adminEmails.includes((currentUser.email || "").trim().toLowerCase()),
  );
  const hasAccess = isAdmin || hasRiderLink;
  const riderPermissionMap = currentRider
    ? permissions[currentRider.id] || {}
    : {};
  const normalizeLinkType = (t) =>
    String(t || "")
      .trim()
      .toLowerCase();
  const isOwnerLinkType = (t) => {
    const v = normalizeLinkType(t);
    return v === "owner" || v === "proprietaire" || v === "propriétaire";
  };
  const ownerHorseIds = new Set(
    (currentRider?.links || [])
      .filter((l) => isOwnerLinkType(l?.type))
      .map((l) => l.horseId),
  );
  const canEditHorseId = (id) =>
    isAdmin ||
    ownerHorseIds.has(id) ||
    riderPermissionMap[id] === "modification";
  const canEditRiderId = (id) =>
    isAdmin || Boolean(currentRider && currentRider.id === id);
  const hasWriteAccess =
    isAdmin ||
    ownerHorseIds.size > 0 ||
    Object.values(riderPermissionMap).includes("modification");
  const roleLabel = isAdmin
    ? "Admin"
    : hasWriteAccess
      ? "Cavalier modification"
      : hasRiderLink
        ? "Cavalier lecture"
        : "Sans lien";
  const roleTone = isAdmin
    ? "green"
    : hasWriteAccess
      ? "blue"
      : hasRiderLink
        ? "slate"
        : "red";
  const googleProvider = new GoogleAuthProvider();
  const readImageAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      if (
        !file ||
        typeof file !== "object" ||
        !("size" in file) ||
        !file.size
      ) {
        resolve("");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () =>
        reject(reader.error || new Error("Image read error"));
      reader.readAsDataURL(file);
    });
  const addCare = (e) => {
    e.preventDefault();
    if (!selected || !canEditHorseId(selected.id)) {
      notify("Lecture seule: action non autorisee");
      return;
    }
    const f = new FormData(e.currentTarget),
      c = {
        id: `c${Date.now()}`,
        date: f.get("date"),
        type: f.get("type"),
        note: f.get("note"),
        by: "Admin Écurie",
      };
    setHorses((x) =>
      x.map((h) =>
        h.id === selectedHorse ? { ...h, care: [c, ...h.care] } : h,
      ),
    );
    log("Soin ajouté", selected.name, `${c.type} • ${c.note}`);
    setModal(null);
    notify("Soin enregistré");
  };
  const addOuting = (e) => {
    e.preventDefault();
    if (!selected || !canEditHorseId(selected.id)) {
      notify("Lecture seule: action non autorisee");
      return;
    }
    const f = new FormData(e.currentTarget),
      o = {
        id: `o${Date.now()}`,
        place: f.get("place"),
        date: f.get("date"),
        duration: f.get("duration"),
        by: "Admin Écurie",
      };
    setHorses((x) =>
      x.map((h) =>
        h.id === selectedHorse
          ? { ...h, status: "En sortie", outings: [o, ...h.outings] }
          : h,
      ),
    );
    log("Sortie signalée", selected.name, `${o.place} • ${o.duration}`);
    setModal(null);
  };
  const addHorse = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      notify("Action reservee a l'admin");
      return;
    }
    if (!ref) {
      notify("Firebase non configure");
      return;
    }
    const f = new FormData(e.currentTarget),
      picked = f.get("photo"),
      defaultPhoto =
        "https://images.unsplash.com/photo-1534773728080-33d31da27ae5?auto=format&fit=crop&w=1200&q=80";
    let photo = defaultPhoto;
    try {
      const dataUrl = await readImageAsDataUrl(picked);
      if (dataUrl) photo = dataUrl;
    } catch (err) {
      console.error("[addHorse] Image read error", err);
      notify("Photo non lisible, image par defaut utilisee");
    }
    const h = {
        id: `h${Date.now()}`,
        name: f.get("name"),
        nickname: String(f.get("nickname") || ""),
        sex: f.get("sex"),
        breed: f.get("breed"),
        birth: f.get("birth"),
        arrival: f.get("arrival"),
        box: f.get("box"),
        diet: f.get("diet"),
        vaccine: f.get("vaccine"),
        status: "Présent",
        owners: [],
        halfBoarders: [],
        outings: [],
        care: [],
        photo,
      },
      auditEntry = {
        id: Date.now(),
        at: new Date().toLocaleString("fr-FR"),
        user: "Admin Écurie",
        action: "Fiche créée",
        subject: h.name,
        detail: `Arrivée le ${fmt(h.arrival)}`,
      },
      nextHorses = [h, ...horses],
      nextAudit = [auditEntry, ...audit],
      payload = { horses: nextHorses, riders, audit: nextAudit, permissions };
    setHorses(nextHorses);
    setAudit(nextAudit);
    setModal(null);
    setCloud("saving");
    setCloudDetail("");
    try {
      await setDoc(ref, payload);
      last.current = JSON.stringify(payload);
      setCloud("synced");
      notify("Equide cree");
    } catch (err) {
      console.error("[addHorse] Echec Firestore", err);
      setHorses(horses);
      setAudit(audit);
      setCloud("error");
      setCloudDetail(firebaseErrorText(err));
      notify("Creation de l'equide echouee");
    }
  };
  const addRider = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      notify("Action reservee a l'admin");
      return;
    }
    if (!ref) {
      notify("Firebase non configure");
      return;
    }
    const f = new FormData(e.currentTarget),
      horseId = String(f.get("horseId") || ""),
      type = String(f.get("linkType") || ""),
      links = horseId && type ? [{ horseId, type }] : [],
      pickedPhoto = f.get("photo"),
      photoData = await readImageAsDataUrl(pickedPhoto),
      r = {
        id: `r${Date.now()}`,
        name: String(f.get("name") || ""),
        email: String(f.get("email") || "")
          .trim()
          .toLowerCase(),
        phone: String(f.get("phone") || ""),
        photo: photoData || "",
        links,
      },
      detail = links.length
        ? `${type} sur ${horses.find((h) => h.id === horseId)?.name || horseId}`
        : "Sans lien initial",
      auditEntry = {
        id: Date.now(),
        at: new Date().toLocaleString("fr-FR"),
        user: "Admin Écurie",
        action: "Cavalier cree",
        subject: r.name,
        detail,
      },
      nextRiders = [r, ...riders],
      nextAudit = [auditEntry, ...audit],
      payload = { horses, riders: nextRiders, audit: nextAudit, permissions };
    console.info("[addRider] Tentative de creation", {
      email: r.email,
      horseId,
      type,
    });
    setRiders(nextRiders);
    setAudit(nextAudit);
    setModal(null);
    setCloud("saving");
    setCloudDetail("");
    try {
      await setDoc(ref, payload);
      last.current = JSON.stringify(payload);
      setCloud("synced");
      notify("Cavalier cree");
      console.info("[addRider] Creation enregistree dans Firestore", {
        riderId: r.id,
        email: r.email,
      });
    } catch (err) {
      console.error("[addRider] Echec Firestore", err);
      setRiders(riders);
      setAudit(audit);
      setCloud("error");
      setCloudDetail(firebaseErrorText(err));
      notify("Creation du cavalier echouee");
    }
  };

  const updateHorse = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      id = f.get("id");
    if (!canEditHorseId(id)) {
      notify("Lecture seule: action non autorisee");
      return;
    }
    const current = horses.find((h) => h.id === id),
      picked = f.get("photo");
    let photo = current?.photo || "";
    try {
      const dataUrl = await readImageAsDataUrl(picked);
      if (dataUrl) photo = dataUrl;
    } catch (err) {
      console.error("[updateHorse] Image read error", err);
      notify("Photo non modifiee: fichier non lisible");
    }
    const next = {
      name: f.get("name"),
      nickname: String(f.get("nickname") || ""),
      sex: f.get("sex"),
      breed: f.get("breed"),
      birth: f.get("birth"),
      arrival: f.get("arrival"),
      box: f.get("box"),
      diet: f.get("diet"),
      vaccine: f.get("vaccine"),
      status: f.get("status"),
      photo,
    };
    setHorses((x) => x.map((h) => (h.id === id ? { ...h, ...next } : h)));
    log(
      "Fiche modifiee",
      String(next.name || id),
      "Informations equide mises a jour",
    );
    setModal(null);
    setEditHorseId(null);
    notify("Equide mis a jour");
  };
  const updateRider = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      id = String(f.get("id") || "");
    if (!canEditRiderId(id)) {
      notify("Action non autorisee");
      return;
    }
    const current = riders.find((r) => r.id === id),
      email = isAdmin
        ? String(f.get("email") || "")
            .trim()
            .toLowerCase()
        : String(current?.email || currentUser?.email || "")
            .trim()
            .toLowerCase(),
      pickedPhoto = f.get("photo"),
      photoData = await readImageAsDataUrl(pickedPhoto),
      next = {
        name: f.get("name"),
        email,
        phone: f.get("phone"),
        photo: photoData || current?.photo || "",
      };
    setRiders((x) => x.map((r) => (r.id === id ? { ...r, ...next } : r)));
    log(
      "Fiche cavalier modifiee",
      String(next.name || id),
      "Informations cavalier mises a jour",
    );
    setModal(null);
    setEditRiderId(null);
    notify("Cavalier mis a jour");
  };
  const loginWithGoogle = () => {
    if (!auth || authBusy) return;
    setAuthBusy(true);
    setAuthMessage("");
    setCloud("loading");
    setCloudDetail("");
    signInWithPopup(auth, googleProvider).catch((e) => {
      setAuthBusy(false);
      setCloud("auth-required");
      setAuthMessage(firebaseErrorText(e));
    });
  };
  const loginWithEmail = (e) => {
    e.preventDefault();
    if (!auth || authBusy) return;
    setAuthBusy(true);
    setAuthMessage("");
    setCloud("loading");
    setCloudDetail("");
    signInWithEmailAndPassword(auth, authEmail.trim(), authPassword).catch(
      (e) => {
        setAuthBusy(false);
        setCloud("auth-required");
        setAuthMessage(firebaseErrorText(e));
      },
    );
  };
  const createAccount = (e) => {
    e.preventDefault();
    if (!auth || authBusy) return;
    setAuthBusy(true);
    setAuthMessage("");
    setCloud("loading");
    setCloudDetail("");
    createUserWithEmailAndPassword(auth, authEmail.trim(), authPassword).catch(
      (e) => {
        setAuthBusy(false);
        setCloud("auth-required");
        setAuthMessage(firebaseErrorText(e));
      },
    );
  };
  const linkUserToRider = (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    const email = adminUserEmail.trim().toLowerCase();
    if (!adminRiderId || !email || !adminHorseId) {
      setAdminMessage("Choisis un cavalier, un email et un cheval");
      return;
    }
    setRiders((list) =>
      list.map((r) => {
        if (r.id !== adminRiderId) return r;
        const links = Array.isArray(r.links) ? r.links : [];
        const nextLink = { horseId: adminHorseId, type: adminRole };
        const withoutSameHorse = links.filter(
          (l) => l.horseId !== adminHorseId,
        );
        return { ...r, email, links: [...withoutSameHorse, nextLink] };
      }),
    );
    setAdminMessage("Association enregistree");
    log(
      "Association utilisateur",
      adminRiderId,
      `${email} lie a ${adminHorseId} (${adminRole})`,
    );
  };
  const deleteLink = async (riderId, horseId) => {
    if (!isAdmin) {
      notify("Action reservee a l'admin");
      return;
    }
    if (!ref) {
      notify("Firebase non configure");
      return;
    }
    const rider = riders.find((r) => r.id === riderId);
    if (!rider) return;
    const horseName = horses.find((h) => h.id === horseId)?.name || horseId;
    if (!window.confirm(`Supprimer la liaison ${rider.name} -> ${horseName} ?`))
      return;
    const nextRiders = riders.map((r) =>
      r.id === riderId
        ? {
            ...r,
            links: (Array.isArray(r.links) ? r.links : []).filter(
              (l) => l.horseId !== horseId,
            ),
          }
        : r,
    );
    const nextPermissions = { ...permissions };
    if (nextPermissions[riderId]) {
      const riderPerms = { ...nextPermissions[riderId] };
      delete riderPerms[horseId];
      nextPermissions[riderId] = riderPerms;
    }
    const auditEntry = {
      id: Date.now(),
      at: new Date().toLocaleString("fr-FR"),
      user: "Admin Écurie",
      action: "Liaison supprimee",
      subject: rider.name,
      detail: horseName,
    };
    const nextAudit = [auditEntry, ...audit];
    const payload = {
      horses,
      riders: nextRiders,
      audit: nextAudit,
      permissions: nextPermissions,
    };
    setRiders(nextRiders);
    setPermissions(nextPermissions);
    setAudit(nextAudit);
    setCloud("saving");
    setCloudDetail("");
    try {
      await setDoc(ref, payload);
      last.current = JSON.stringify(payload);
      setCloud("synced");
      notify("Liaison supprimee");
    } catch (err) {
      console.error("[deleteLink] Echec Firestore", err);
      setRiders(riders);
      setPermissions(permissions);
      setAudit(audit);
      setCloud("error");
      setCloudDetail(firebaseErrorText(err));
      notify("Suppression de la liaison echouee");
    }
  };
  const deleteHorse = async (horseId) => {
    if (!isAdmin) {
      notify("Action reservee a l'admin");
      return;
    }
    if (!ref) {
      notify("Firebase non configure");
      return;
    }
    const horse = horses.find((h) => h.id === horseId);
    if (!horse) return;
    if (!window.confirm(`Supprimer l'equide ${horse.name} ?`)) return;
    const nextHorses = horses.filter((h) => h.id !== horseId);
    const nextRiders = riders.map((r) => ({
      ...r,
      links: (Array.isArray(r.links) ? r.links : []).filter(
        (l) => l.horseId !== horseId,
      ),
    }));
    const nextPermissions = { ...permissions };
    Object.keys(nextPermissions).forEach((rid) => {
      const riderPerms = { ...(nextPermissions[rid] || {}) };
      delete riderPerms[horseId];
      nextPermissions[rid] = riderPerms;
    });
    const auditEntry = {
      id: Date.now(),
      at: new Date().toLocaleString("fr-FR"),
      user: "Admin Écurie",
      action: "Equide supprime",
      subject: horse.name,
      detail: "Fiche retiree",
    };
    const nextAudit = [auditEntry, ...audit];
    const payload = {
      horses: nextHorses,
      riders: nextRiders,
      audit: nextAudit,
      permissions: nextPermissions,
    };
    setHorses(nextHorses);
    setRiders(nextRiders);
    setPermissions(nextPermissions);
    setAudit(nextAudit);
    if (selectedHorse === horseId) setSelectedHorse(null);
    setCloud("saving");
    setCloudDetail("");
    try {
      await setDoc(ref, payload);
      last.current = JSON.stringify(payload);
      setCloud("synced");
      notify("Equide supprime");
    } catch (err) {
      console.error("[deleteHorse] Echec Firestore", err);
      setHorses(horses);
      setRiders(riders);
      setPermissions(permissions);
      setAudit(audit);
      setCloud("error");
      setCloudDetail(firebaseErrorText(err));
      notify("Suppression de l'equide echouee");
    }
  };
  const deleteRider = async (riderId) => {
    if (!isAdmin) {
      notify("Action reservee a l'admin");
      return;
    }
    if (!ref) {
      notify("Firebase non configure");
      return;
    }
    const rider = riders.find((r) => r.id === riderId);
    if (!rider) return;
    if (!window.confirm(`Supprimer le cavalier ${rider.name} ?`)) return;
    const nextRiders = riders.filter((r) => r.id !== riderId);
    const nextPermissions = { ...permissions };
    delete nextPermissions[riderId];
    const auditEntry = {
      id: Date.now(),
      at: new Date().toLocaleString("fr-FR"),
      user: "Admin Écurie",
      action: "Cavalier supprime",
      subject: rider.name,
      detail: "Fiche retiree",
    };
    const nextAudit = [auditEntry, ...audit];
    const payload = {
      horses,
      riders: nextRiders,
      audit: nextAudit,
      permissions: nextPermissions,
    };
    setRiders(nextRiders);
    setPermissions(nextPermissions);
    setAudit(nextAudit);
    setCloud("saving");
    setCloudDetail("");
    try {
      await setDoc(ref, payload);
      last.current = JSON.stringify(payload);
      setCloud("synced");
      notify("Cavalier supprime");
    } catch (err) {
      console.error("[deleteRider] Echec Firestore", err);
      setRiders(riders);
      setPermissions(permissions);
      setAudit(audit);
      setCloud("error");
      setCloudDetail(firebaseErrorText(err));
      notify("Suppression du cavalier echouee");
    }
  };
  const logout = () => {
    setCloud("auth-required");
    setCloudDetail("");
    setCurrentUser(null);
    setUserReady(false);
    setSelectedHorse(null);
    setModal(null);
    if (!auth) return;
    signOut(auth).catch((e) => {
      console.error("Firebase sign out error", e);
      setAuthMessage(firebaseErrorText(e));
    });
  };
  const goTab = (id) => {
    setTab(id);
    setSelectedHorse(null);
    setModal(null);
  };
  const handleTabPress = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    goTab(id);
  };
  useEffect(() => {
    if (!isAdmin && (tab === "links" || tab === "rights" || tab === "audit"))
      setTab("home");
  }, [isAdmin, tab]);

  const Nav = () => (
    <nav className="fixed inset-x-0 bottom-0 z-[90] mx-auto flex max-w-lg justify-around border-t bg-white px-2 py-2 pointer-events-auto">
      {[
        ["home", Home, "Accueil"],
        ["horses", HorseIcon, "Équidés"],
        ["riders", Users, "Cavaliers"],
        ...(isAdmin
          ? [
              ["links", Link2, "Liaisons"],
              ["rights", ShieldCheck, "Droits"],
              ["audit", History, "Journal"],
            ]
          : []),
      ].map(([id, I, l]) => (
        <button
          type="button"
          key={id}
          onPointerUp={(e) => handleTabPress(e, id)}
          onClick={(e) => handleTabPress(e, id)}
          className={`touch-manipulation flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-[10px] font-semibold ${tab === id ? "bg-emerald-50 text-emerald-700" : "text-slate-400"}`}>
          <I size={20} />
          {l}
        </button>
      ))}
    </nav>
  );
  if (cloud === "auth-required")
    return (
      <div className="min-h-screen bg-slate-100 p-4">
        <div className="mx-auto mt-16 w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 inline-flex rounded-2xl bg-emerald-800 p-3 text-white">
              <ShieldCheck />
            </div>
            <h1 className="text-2xl font-black">Connexion requise</h1>
            <p className="mt-2 text-sm text-slate-600">
              Connecte-toi avec Google ou avec ton email pour accéder aux
              données de l'écurie.
            </p>
          </div>
          <form onSubmit={loginWithEmail} className="space-y-3">
            <input
              type="email"
              required
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="Email"
              className={input}
            />
            <input
              type="password"
              required
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Mot de passe"
              className={input}
            />
            <button
              disabled={authBusy}
              className="w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
              {authBusy ? "Connexion..." : "Se connecter"}
            </button>
            <button
              type="button"
              disabled={authBusy}
              onClick={createAccount}
              className="w-full rounded-2xl border border-emerald-700 px-4 py-3 text-sm font-bold text-emerald-700 disabled:opacity-60">
              Creer un compte
            </button>
          </form>
          <div className="my-4 h-px bg-slate-200" />
          <button
            disabled={authBusy}
            onClick={loginWithGoogle}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
            Continuer avec Google
          </button>
          {authMessage && (
            <p className="mt-3 text-center text-sm text-rose-600">
              {authMessage}
            </p>
          )}
        </div>
      </div>
    );
  if (cloud === "forbidden")
    return (
      <div className="min-h-screen bg-slate-100 p-4">
        <div className="mx-auto mt-16 w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 inline-flex rounded-2xl bg-rose-100 p-3 text-rose-700">
              <ShieldCheck />
            </div>
            <h1 className="text-2xl font-black">Acces refuse</h1>
            <p className="mt-2 text-sm text-slate-600">
              Aucun lien cavalier n'est associe a ce compte (
              {currentUser?.email || "email inconnu"}). Contacte
              l'administrateur.
            </p>
          </div>
          <button
            onClick={logout}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
            Se deconnecter
          </button>
        </div>
      </div>
    );
  if (selected)
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <div className="relative h-64 overflow-hidden">
          <img src={selected.photo} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
          <button
            onClick={() => setSelectedHorse(null)}
            className="absolute left-4 top-4 rounded-full bg-white p-2">
            <ChevronLeft />
          </button>
          <div className="absolute bottom-5 left-5 text-white">
            <Pill tone={selected.status === "En sortie" ? "amber" : "green"}>
              {selected.status}
            </Pill>
            <h1 className="mt-2 text-3xl font-black">
              {selected.name}
              {selected.nickname ? ` (${selected.nickname})` : ""}
            </h1>
            <p>
              {selected.sex} • {selected.breed}
            </p>
          </div>
        </div>
        <main className="mx-auto max-w-3xl space-y-4 p-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={!canEditHorseId(selected.id)}
              onClick={() => setModal("outing")}
              className="rounded-2xl bg-amber-500 p-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
              Signaler une sortie
            </button>
            <button
              disabled={!canEditHorseId(selected.id)}
              onClick={() => setModal("care")}
              className="rounded-2xl bg-emerald-700 p-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
              Ajouter un soin
            </button>
          </div>
          {[
            [
              "Informations",
              `Arrivée : ${fmt(selected.arrival)} • Vaccin : ${fmt(selected.vaccine)}`,
            ],
            ["Régime particulier", selected.diet],
          ].map(([t, c]) => (
            <section key={t} className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-2 font-bold">{t}</h2>
              <p className="text-sm text-slate-600">{c}</p>
            </section>
          ))}
          <section className="rounded-2xl bg-white p-5">
            <h2 className="mb-3 font-bold">Historique des soins</h2>
            {selected.care.map((c) => (
              <div
                key={c.id}
                className="border-l-2 border-emerald-300 py-2 pl-4">
                <b>{c.type}</b>
                <p className="text-sm">{c.note}</p>
                <small>
                  {fmt(c.date)} • {c.by}
                </small>
              </div>
            ))}
          </section>
        </main>
        {modal === "care" && (
          <Modal title="Ajouter un soin" onClose={() => setModal(null)}>
            <form onSubmit={addCare} className="space-y-4">
              <Field label="Date">
                <input required name="date" type="date" className={input} />
              </Field>
              <Field label="Type">
                <input required name="type" className={input} />
              </Field>
              <Field label="Compte rendu">
                <textarea required name="note" className={input} />
              </Field>
              <button className="w-full rounded-xl bg-emerald-700 p-3 font-bold text-white">
                Enregistrer
              </button>
            </form>
          </Modal>
        )}
        {modal === "outing" && (
          <Modal title="Signaler une sortie" onClose={() => setModal(null)}>
            <form onSubmit={addOuting} className="space-y-4">
              <Field label="Destination">
                <input required name="place" className={input} />
              </Field>
              <Field label="Date">
                <input required name="date" type="date" className={input} />
              </Field>
              <Field label="Durée">
                <input required name="duration" className={input} />
              </Field>
              <button className="w-full rounded-xl bg-amber-500 p-3 font-bold text-white">
                Confirmer
              </button>
            </form>
          </Modal>
        )}
        <Nav />
      </div>
    );
  return (
    <div className="min-h-screen pb-24 text-slate-900">
      <header className="sticky top-0 z-20 border-b bg-[#f5f7f4]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-800 p-3 text-white">
              <Home />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-emerald-700">
                ÉquiPension
              </p>
              <h1 className="font-black">Haras des Vallons</h1>
              <div className="mt-1">
                <Pill tone={roleTone}>{roleLabel}</Pill>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${cloud === "synced" ? "bg-emerald-100 text-emerald-800" : cloud === "error" || cloud === "unconfigured" || cloud === "auth-required" || cloud === "forbidden" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}`}>
              {cloud === "synced" ? (
                <Cloud size={16} />
              ) : cloud === "error" ||
                cloud === "unconfigured" ||
                cloud === "auth-required" ||
                cloud === "forbidden" ? (
                <CloudOff size={16} />
              ) : (
                <LoaderCircle size={16} className="animate-spin" />
              )}
              {cloud === "synced"
                ? "Synchronisé"
                : cloud === "saving"
                  ? "Enregistrement…"
                  : cloud === "loading"
                    ? "Connexion…"
                    : cloud === "error"
                      ? "Erreur Firebase"
                      : cloud === "auth-required"
                        ? "Connexion requise"
                        : cloud === "forbidden"
                          ? "Acces refuse"
                          : "Firebase à configurer"}
            </div>
            {currentUser && (
              <button
                onClick={logout}
                className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700">
                Deconnexion
              </button>
            )}
          </div>
        </div>
        {cloud === "error" && cloudDetail && (
          <p className="mx-auto max-w-5xl px-4 pb-3 text-xs font-semibold text-rose-700">
            {cloudDetail}
          </p>
        )}
      </header>
      <main className="mx-auto max-w-5xl p-4 sm:p-6">
        {tab === "home" && (
          <div className="space-y-6">
            <section className="rounded-3xl bg-emerald-900 p-6 text-white">
              <p>Bonjour, Admin 👋</p>
              <h2 className="text-2xl font-black">Tout va bien à l'écurie</h2>
              <div className="mt-6 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-white/10 p-3">
                  <b className="text-2xl">{horses.length}</b>
                  <p className="text-xs">Équidés</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <b className="text-2xl">
                    {horses.filter((h) => h.status === "En sortie").length}
                  </b>
                  <p className="text-xs">En sortie</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <b className="text-2xl">{audit.length}</b>
                  <p className="text-xs">Modifications</p>
                </div>
              </div>
            </section>
          </div>
        )}
        {tab === "horses" && (
          <div>
            <div className="mb-4 flex justify-between">
              <div>
                <h2 className="text-2xl font-black">Équidés</h2>
                <p className="text-sm text-slate-500">{horses.length} fiches</p>
              </div>
              <button
                disabled={!isAdmin}
                onClick={() => setModal("horse")}
                className="rounded-xl bg-emerald-700 px-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                <Plus className="inline" /> Ajouter
              </button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={`${input} pl-11`}
                placeholder="Rechercher…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((h) => (
                <div
                  key={h.id}
                  className="overflow-hidden rounded-2xl bg-white shadow">
                  <button
                    onClick={() => setSelectedHorse(h.id)}
                    className="w-full text-left">
                    <img src={h.photo} className="h-40 w-full object-cover" />
                    <div className="p-4">
                      <h3 className="font-black">{h.name}</h3>
                    </div>
                  </button>
                  <div className="flex items-center justify-between px-4 pb-4">
                    <p className="text-xs text-slate-500">
                      {h.breed} • {h.box}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={!canEditHorseId(h.id)}
                        onClick={() => {
                          setEditHorseId(h.id);
                          setModal("editHorse");
                        }}
                        className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                        Modifier
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => deleteHorse(h.id)}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700">
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === "riders" && (
          <div className="space-y-3">
            <div className="mb-1 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black">Cavaliers</h2>
              <button
                disabled={!isAdmin}
                onClick={() => setModal("rider")}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                <Plus className="inline" /> Ajouter
              </button>
            </div>
            {riders.map((r) => (
              <div key={r.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {r.photo ? (
                      <img
                        src={r.photo}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500">
                        <UserRound size={18} />
                      </div>
                    )}
                    <b>{r.name}</b>
                  </div>
                  <button
                    disabled={!canEditRiderId(r.id)}
                    onClick={() => {
                      setEditRiderId(r.id);
                      setModal("editRider");
                    }}
                    className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                    Modifier
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => deleteRider(r.id)}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700">
                      Supprimer
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {r.email} • {r.phone}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.links?.length ? (
                    r.links.map((l) => (
                      <Pill key={l.horseId} tone="blue">
                        {horses.find((h) => h.id === l.horseId)?.name} •{" "}
                        {l.type}
                      </Pill>
                    ))
                  ) : (
                    <Pill tone="slate">Aucun lien</Pill>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "links" && isAdmin && (
          <div>
            <h2 className="mb-4 text-2xl font-black">Gestion des liaisons</h2>
            <section className="mb-4 rounded-2xl bg-emerald-50 p-4">
              <h3 className="mb-2 font-bold text-emerald-900">
                Administration des liaisons
              </h3>
              <p className="mb-3 text-sm text-emerald-800">
                Associe un compte Firebase a un cavalier. Sans lien cavalier,
                l'utilisateur est bloque.
              </p>
              <form
                onSubmit={linkUserToRider}
                className="grid gap-3 sm:grid-cols-2">
                <select
                  value={adminRiderId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setAdminRiderId(id);
                    const rider = riders.find((x) => x.id === id);
                    if (rider?.email) setAdminUserEmail(rider.email);
                    if (rider?.links?.[0]?.horseId)
                      setAdminHorseId(rider.links[0].horseId);
                  }}
                  className={input}>
                  <option value="">Choisir un cavalier</option>
                  {riders.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <input
                  type="email"
                  value={adminUserEmail}
                  onChange={(e) => setAdminUserEmail(e.target.value)}
                  placeholder="Email du compte Firebase"
                  className={input}
                />
                <select
                  value={adminHorseId}
                  onChange={(e) => setAdminHorseId(e.target.value)}
                  className={input}>
                  <option value="">Choisir un cheval</option>
                  {horses.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
                <select
                  value={adminRole}
                  onChange={(e) => setAdminRole(e.target.value)}
                  className={input}>
                  <option>Proprietaire</option>
                  <option>Demi-pension</option>
                  <option>Coach</option>
                </select>
                <button className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white sm:col-span-2">
                  Enregistrer la liaison
                </button>
              </form>
              {adminMessage && (
                <p className="mt-3 text-sm text-emerald-900">{adminMessage}</p>
              )}
            </section>
            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-bold">Liaisons existantes</h3>
              <div className="space-y-3">
                {riders.map((r) => {
                  const riderLinks = Array.isArray(r.links) ? r.links : [];
                  return (
                    <div key={r.id} className="rounded-xl border p-3">
                      <p className="mb-2 font-semibold">{r.name}</p>
                      <p className="mb-2 text-xs text-slate-500">{r.email}</p>
                      {riderLinks.length ? (
                        <div className="space-y-2">
                          {riderLinks.map((l, idx) => {
                            const horseName =
                              horses.find((h) => h.id === l.horseId)?.name ||
                              l.horseId ||
                              "Equide inconnu";
                            return (
                              <div
                                key={`${r.id}-${l.horseId}-${idx}`}
                                className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                                <Pill tone="blue">
                                  {horseName} • {l.type || "Role non defini"}
                                </Pill>
                                <button
                                  type="button"
                                  onClick={() => deleteLink(r.id, l.horseId)}
                                  className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700">
                                  Supprimer
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <Pill tone="slate">Aucune liaison</Pill>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
        {tab === "rights" && isAdmin && (
          <div>
            <h2 className="mb-4 text-2xl font-black">Droits d'accès</h2>
            {riders.map((r) => (
              <section key={r.id} className="mb-4 rounded-2xl bg-white p-4">
                <b>{r.name}</b>
                {horses.map((h) => (
                  <div
                    key={h.id}
                    className="mt-3 flex items-center justify-between border-t pt-3">
                    <span>{h.name}</span>
                    <select
                      disabled={!isAdmin}
                      value={permissions[r.id]?.[h.id] || "none"}
                      onChange={(e) => {
                        const v = e.target.value;
                        setPermissions((p) => ({
                          ...p,
                          [r.id]: { ...(p[r.id] || {}), [h.id]: v },
                        }));
                        log("Droit modifie", r.name, `${v} sur ${h.name}`);
                      }}
                      className="rounded-lg border p-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <option value="none">Aucun</option>
                      <option value="lecture">Lecture</option>
                      <option value="modification">Modification</option>
                    </select>
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}
        {tab === "audit" && isAdmin && (
          <div>
            <h2 className="mb-4 text-2xl font-black">Journal d'audit</h2>
            {audit.map((a) => (
              <article key={a.id} className="mb-3 rounded-2xl bg-white p-4">
                <b>{a.action}</b>
                <p className="text-emerald-800">{a.subject}</p>
                <p className="text-sm text-slate-500">{a.detail}</p>
                <small>
                  {a.at} • {a.user}
                </small>
              </article>
            ))}
          </div>
        )}
      </main>
      {modal === "horse" && (
        <Modal title="Nouvel équidé" onClose={() => setModal(null)}>
          <form onSubmit={addHorse} className="space-y-3">
            {[
              ["Nom", "name", "text"],
              ["Surnom", "nickname", "text"],
              ["Race", "breed", "text"],
              ["Date de naissance", "birth", "date"],
              ["Date d'arrivée", "arrival", "date"],
              ["Box / emplacement", "box", "text"],
              ["Dernier vaccin", "vaccine", "date"],
            ].map(([l, n, t]) => (
              <Field key={n} label={l}>
                <input
                  required={n === "name"}
                  name={n}
                  type={t}
                  className={input}
                />
              </Field>
            ))}
            <Field label="Sexe">
              <select name="sex" className={input}>
                <option>Jument</option>
                <option>Hongre</option>
                <option>Étalon</option>
              </select>
            </Field>
            <Field label="Régime">
              <textarea name="diet" className={input} />
            </Field>
            <Field label="Photo (optionnelle)">
              <input
                name="photo"
                type="file"
                accept="image/*"
                className={input}
              />
            </Field>
            <button className="w-full rounded-xl bg-emerald-700 p-3 font-bold text-white">
              Créer la fiche
            </button>
          </form>
        </Modal>
      )}
      {modal === "editHorse" && horseToEdit && (
        <Modal
          title="Modifier un équidé"
          onClose={() => {
            setModal(null);
            setEditHorseId(null);
          }}>
          <form onSubmit={updateHorse} className="space-y-3">
            <input type="hidden" name="id" value={horseToEdit.id} />
            {[
              ["Nom", "name", "text", horseToEdit.name],
              ["Surnom", "nickname", "text", horseToEdit.nickname || ""],
              ["Race", "breed", "text", horseToEdit.breed],
              ["Date de naissance", "birth", "date", horseToEdit.birth],
              ["Date d'arrivée", "arrival", "date", horseToEdit.arrival],
              ["Box / emplacement", "box", "text", horseToEdit.box],
              ["Dernier vaccin", "vaccine", "date", horseToEdit.vaccine],
            ].map(([l, n, t, v]) => (
              <Field key={n} label={l}>
                <input
                  required={n === "name"}
                  name={n}
                  type={t}
                  defaultValue={v}
                  className={input}
                />
              </Field>
            ))}
            <Field label="Sexe">
              <select
                name="sex"
                defaultValue={horseToEdit.sex}
                className={input}>
                <option>Jument</option>
                <option>Hongre</option>
                <option>Étalon</option>
              </select>
            </Field>
            <Field label="Statut">
              <select
                name="status"
                defaultValue={horseToEdit.status}
                className={input}>
                <option>Présente</option>
                <option>Présent</option>
                <option>En sortie</option>
              </select>
            </Field>
            <Field label="Régime">
              <textarea
                name="diet"
                defaultValue={horseToEdit.diet}
                className={input}
              />
            </Field>
            <Field label="Photo (optionnelle)">
              <input
                name="photo"
                type="file"
                accept="image/*"
                className={input}
              />
            </Field>
            <button className="w-full rounded-xl bg-emerald-700 p-3 font-bold text-white">
              Enregistrer
            </button>
          </form>
        </Modal>
      )}
      {modal === "editRider" && riderToEdit && (
        <Modal
          title="Modifier un cavalier"
          onClose={() => {
            setModal(null);
            setEditRiderId(null);
          }}>
          <form onSubmit={updateRider} className="space-y-3">
            <input type="hidden" name="id" value={riderToEdit.id} />
            <Field label="Nom">
              <input
                required
                name="name"
                defaultValue={riderToEdit.name}
                className={input}
              />
            </Field>
            <Field label="Email">
              <input
                required
                type="email"
                name="email"
                defaultValue={riderToEdit.email}
                disabled={!isAdmin}
                className={input}
              />
            </Field>
            <Field label="Telephone">
              <input
                name="phone"
                defaultValue={riderToEdit.phone}
                className={input}
              />
            </Field>
            <Field label="Photo (optionnelle)">
              <input
                name="photo"
                type="file"
                accept="image/*"
                className={input}
              />
            </Field>
            <button className="w-full rounded-xl bg-emerald-700 p-3 font-bold text-white">
              Enregistrer
            </button>
          </form>
        </Modal>
      )}
      {modal === "rider" && (
        <Modal title="Nouveau cavalier" onClose={() => setModal(null)}>
          <form onSubmit={addRider} className="space-y-3">
            <Field label="Nom">
              <input required name="name" className={input} />
            </Field>
            <Field label="Email">
              <input required type="email" name="email" className={input} />
            </Field>
            <Field label="Telephone">
              <input name="phone" className={input} />
            </Field>
            <Field label="Photo (optionnelle)">
              <input
                name="photo"
                type="file"
                accept="image/*"
                className={input}
              />
            </Field>
            <Field label="Lien initial (optionnel)">
              <div className="grid gap-3 sm:grid-cols-2">
                <select name="horseId" className={input}>
                  <option value="">Aucun equide</option>
                  {horses.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
                <select name="linkType" className={input}>
                  <option value="owner">Proprietaire</option>
                  <option value="halfBoarder">Demi-pensionnaire</option>
                </select>
              </div>
            </Field>
            <button className="w-full rounded-xl bg-emerald-700 p-3 font-bold text-white">
              Creer le cavalier
            </button>
          </form>
        </Modal>
      )}
      {toast && (
        <div className="fixed left-1/2 top-20 z-[60] -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-white">
          <Check className="inline" size={17} /> {toast}
        </div>
      )}
      <Nav />
    </div>
  );
}
