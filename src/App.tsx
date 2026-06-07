import React, { useState, useEffect } from 'react';
import { auth, db, loginWithGoogle, logout, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, onSnapshot, updateDoc, setDoc, query, where, getDoc, deleteDoc } from 'firebase/firestore';
import { QrCode, Facebook, Instagram, MessageCircle as Whatsapp, ScanLine, Trash2, PowerOff, Shield, Zap, Info, ChevronDown, ChevronUp, Copy, Check, Link, Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { playClickSound, playAttackASound, playAttackBSound, playLevelUpSound, playErrorSound, playSyncSuccessSound, playRecycleSound, getCyberSynthMuted, setCyberSynthMuted } from './utils/cyberSynth';

const CHAR_DATA: Record<string, any> = {
  "AURUM": { 
    type: "Legendario", 
    class: "Vanguardia", 
    vel: 4, 
    en: 8, 
    passive: "Baluarte Áureo (-15% Daño Absorbido)", 
    img: "/AURUM_2-5D.png", 
    desc: "Gobernador supremo blindado de las líneas defensivas de NeoForja.",
    attackA: { name: "MARTILLO DE LUZ IMPERIAL", anim: "aurum-impact" },
    attackB: { name: "SINGULARIDAD REFRACTARIA SOLAR", anim: "aurum-singularity" }
  },
  "BIT": { 
    type: "Común", 
    class: "Explorador", 
    vel: 9, 
    en: 4, 
    passive: "Red Efímera (+20% Detección Silente)", 
    img: "/BIT_2-5D.png", 
    desc: "Reconocimiento y desvío táctico veloz de baja latencia.",
    attackA: { name: "SOBRECARGA DE PORTAL COGNITIVO", anim: "bit-glitch" },
    attackB: { name: "BLITZ DE TELEPORTACIÓN DIGITAL", anim: "bit-teleport" }
  },
  "BYTE": { 
    type: "Común", 
    class: "Defensor", 
    vel: 3, 
    en: 7, 
    passive: "Escudo de Silicio Sólido (Hormigón)", 
    img: "/Byte_2-5D.png", 
    desc: "Defensa maciza monolítica de resguardo estructural.",
    attackA: { name: "PROYECCIÓN DE BLOQUES DE SILICIO", anim: "byte-shatter" },
    attackB: { name: "CORTAFUEGOS CRIPTOGRÁFICO", anim: "byte-shell" }
  },
  "CY-Draco": { 
    type: "Épico", 
    class: "Asaltante", 
    vel: 7, 
    en: 9, 
    passive: "Furia de Dragón (+20% Daño Crítico)", 
    img: "/CY-Dragon_2-5D.png", 
    desc: "Aniquilador de élite cargado con celdas de combustible termonuclear.",
    attackA: { name: "PLASMA DE HYPER-FUSIÓN DRACÓNICA", anim: "draco-plasma" },
    attackB: { name: "PURGA TERMONUCLEAR DE PLASMA", anim: "draco-purga" }
  },
  "Mecha-Yunque": { 
    type: "Raro", 
    class: "Pesado", 
    vel: 2, 
    en: 10, 
    passive: "Núcleo de Estabilización Magnética", 
    img: "/Mecha- Yunque_2-5D.png", 
    desc: "Unidad autopropulsada de forja pesada y deformación tectónica.",
    attackA: { name: "MARTILLO DE PRESIÓN GRAVITACIONAL", anim: "yunque-slam" },
    attackB: { name: "ONDA DE CHOQUE DE REPERCUSIÓN", anim: "yunque-shockwave" }
  },
  "VOXEL": { 
    type: "Raro", 
    class: "Vigilante", 
    vel: 8, 
    en: 6, 
    passive: "Ocultamiento de Matriz de Sigilo Invasivo", 
    img: "/Voxel_2-5D.png", 
    desc: "Maestro del hackeo invisible e interferencia de señales.",
    attackA: { name: "BARRIDO DE MATRIZ SIGILOSA", anim: "voxel-fade" },
    attackB: { name: "DESCORRELACIÓN DE PIXELES CUÁNTICOS", anim: "voxel-dissolve" }
  }
};

const getRarityConfig = (rarity: string) => {
  switch (rarity) {
    case "Legendario":
      return {
        cardClass: "rarity-legendario",
        textClass: "text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]",
        glowBg: "bg-amber-500/20",
        cornerBorder: "border-amber-500",
        btnAClass: "border-amber-500 bg-amber-500/10 hover:bg-amber-500/30 text-amber-400",
        btnBClass: "border-yellow-600 bg-yellow-600/10 hover:bg-yellow-600/30 text-yellow-500",
        badgeBg: "bg-amber-500/20 text-amber-400 border-amber-500/50",
      };
    case "Épico":
      return {
        cardClass: "rarity-epico",
        textClass: "text-fuchsia-400 drop-shadow-[0_0_6px_rgba(217,70,239,0.5)]",
        glowBg: "bg-fuchsia-500/20",
        cornerBorder: "border-fuchsia-500",
        btnAClass: "border-fuchsia-500 bg-fuchsia-500/10 hover:bg-fuchsia-500/30 text-fuchsia-400",
        btnBClass: "border-purple-600 bg-purple-600/10 hover:bg-purple-600/30 text-purple-400",
        badgeBg: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/50",
      };
    case "Raro":
      return {
        cardClass: "rarity-raro",
        textClass: "text-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]",
        glowBg: "bg-blue-500/20",
        cornerBorder: "border-blue-500",
        btnAClass: "border-blue-500 bg-blue-500/10 hover:bg-blue-500/30 text-blue-400",
        btnBClass: "border-indigo-600 bg-indigo-600/10 hover:bg-indigo-600/30 text-indigo-400",
        badgeBg: "bg-blue-500/20 text-blue-400 border-blue-500/50",
      };
    case "Común":
    default:
      return {
        cardClass: "rarity-comun",
        textClass: "text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.5)]",
        glowBg: "bg-cyan-500/15",
        cornerBorder: "border-cyan-500",
        btnAClass: "border-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/30 text-cyan-400",
        btnBClass: "border-teal-600 bg-teal-600/10 hover:bg-teal-600/30 text-teal-400",
        badgeBg: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
      };
  }
};

const STATS_LABEL: Record<string, string> = {
  "AURUM": "DATOS DE VANGUARDIA",
  "BIT": "DATOS DE EXPLORADOR",
  "BYTE": "DATOS DE DEFENSOR",
  "CY-Draco": "DATOS DE ASALTANTE",
  "Mecha-Yunque": "DATOS DE PESADO",
  "VOXEL": "DATOS DE VIGILANTE"
};

const ADMIN_EMAILS = ["samuel.metroid@gmail.com", "arahif98@gmail.com"];

const getCleanAppOrigin = (): string => {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const hostname = window.location.hostname;
  // Si estamos en el editor/iframe de Google AI Studio, o en el entorno privado de desarrollo de Cloud Run (ais-dev),
  // o si no estamos en el origen de vista previa pública, forzamos la URL de vista previa pública segura y compartida para evitar errores 404 en móviles u otros dispositivos sin sesión de desarrollo.
  if (
    origin.includes('aistudio.google.com') || 
    origin.includes('ais-dev') || 
    hostname.includes('aistudio') ||
    hostname.includes('ais-dev')
  ) {
    return 'https://ais-pre-g3zh3wp5zagrcxyelimums-309514035615.us-west2.run.app';
  }
  return origin;
};


export default function App() {
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [allChips, setAllChips] = useState<any[]>([]); // For admin
  const [loading, setLoading] = useState(true);
  
  const [showQRModal, setShowQRModal] = useState<{ active: boolean; uid: string | null; charName: string | null }>({ active: false, uid: null, charName: null });
  const [showScanner, setShowScanner] = useState(false);
  const [scannerMode, setScannerMode] = useState<'TRANSFER' | 'ADMIN_RECYCLE' | 'CLAIM_CHIP'>('TRANSFER');
  const [animatingChips, setAnimatingChips] = useState<Record<string, string>>({});
  const [shakingCards, setShakingCards] = useState<Record<string, string>>({});
  const [impactFlashes, setImpactFlashes] = useState<Record<string, { type: string, attackIndex: 'A' | 'B', key: number }>>({});
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [discountActive, setDiscountActive] = useState(false);
  const [ataquesHoy, setAtaquesHoy] = useState(0);
  const [ataquesTotales, setAtaquesTotales] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(getCyberSynthMuted());

  const toggleAudioMuted = () => {
    const nextMuted = !isMutedGlobalAndLocal();
    setCyberSynthMuted(nextMuted);
    setIsAudioMuted(nextMuted);
    if (!nextMuted) {
      setTimeout(() => playClickSound(), 50);
    }
  };

  const isMutedGlobalAndLocal = () => {
    return getCyberSynthMuted();
  };

  // New states for Claiming Chips & Admin controls
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [tabSyncedElsewhere, setTabSyncedElsewhere] = useState(false);
  const [nfcReading, setNfcReading] = useState(false);
  const [nfcError, setNfcError] = useState("");
  const [nfcSuccessMsg, setNfcSuccessMsg] = useState("");
  const [showInventoryList, setShowInventoryList] = useState(true);
  const [primedDeleteId, setPrimedDeleteId] = useState<string | null>(null);

  // Admin New Chip Registration inputs
  const [adminUid, setAdminUid] = useState("");
  const [adminChar, setAdminChar] = useState("AURUM");
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  
  // Copy to clipboard helpers
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastForgedChip, setLastForgedChip] = useState<{ id: string, character: string } | null>(null);

  // Level Up Animation & Experience tracking states
  const [levelUpChipId, setLevelUpChipId] = useState<string | null>(null);
  const [showLevelUpActive, setShowLevelUpActive] = useState(false);
  const [levelUpPrevLevel, setLevelUpPrevLevel] = useState(1);
  const [levelUpNewLevel, setLevelUpNewLevel] = useState(2);

  // Helper to calculate total accumulated experience of a chip based on its level and current exp
  const conseguirExpAcumulada = (chip: any) => {
    let total = 0;
    const lvl = chip.level || 1;
    for (let i = 1; i < lvl; i++) {
      total += i * 10;
    }
    total += chip.exp || 0;
    return total;
  };

  const aplicarSinergiaAlbum = async (nuevoId: string, nuevoPersonaje: string) => {
    // Check if the user already has any other chip with this character name
    const alreadyHadPersonaje = inventory.some(chip => chip.personaje === nuevoPersonaje && chip.id !== nuevoId);
    
    if (!alreadyHadPersonaje) {
      // This is a NEW character unlock in their Digital Album!
      // Add +15 EXP to all other chips currently owned by the user.
      const otherChips = inventory.filter(chip => chip.id !== nuevoId);
      if (otherChips.length === 0) return;

      let synergyCount = 0;
      for (const chip of otherChips) {
        const chipRef = doc(db, 'inventario_disponible', chip.id);
        const currentLevel = chip.level || 1;
        const currentExp = chip.exp || 0;
        
        let newExp = currentExp + 15;
        let finalLevel = currentLevel;
        let tempLevel = currentLevel;
        
        // Loop in case of multiple level-ups
        while (newExp >= tempLevel * 10) {
          newExp -= tempLevel * 10;
          tempLevel += 1;
        }
        finalLevel = tempLevel;

        await updateDoc(chipRef, {
          exp: newExp,
          level: finalLevel
        });
        
        if (finalLevel > currentLevel) {
          setLevelUpChipId(chip.id);
          setLevelUpPrevLevel(currentLevel);
          setLevelUpNewLevel(finalLevel);
          setShowLevelUpActive(true);
        }
        synergyCount++;
      }
      
      showSystemToast(
        `¡SINERGIA DE ÁLBUM! Al registrar un nuevo personaje (${nuevoPersonaje}), se ha otorgado +15 de experiencia a tus otros ${synergyCount} personajes adquiridos en tu escuadrón.`,
        "COLECCIÓN EXPANDIDA"
      );
    }
  };



  // Custom futuristic modal alert toast
  const [systemToast, setSystemToast] = useState<{ message: string; title: string } | null>(null);

  const showSystemToast = (message: string, title = "COMUNICADO DE RED") => {
    setSystemToast({ message, title });
    if (navigator.vibrate) {
      navigator.vibrate([80, 50, 80]);
    }
  };

  const copyNfcUrl = (uid: string) => {
    const url = `${getCleanAppOrigin()}/?uid=${uid.trim()}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(uid);
      triggerVibration();
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(err => {
      console.error("Error al copiar link: ", err);
    });
  };

  // Listen to fullscreen changes to update UI state
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Initialize Auth & listen to changes
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let unsubAll: (() => void) | null = null;
    let unsubUser: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      // Clean up previous listeners
      if (unsubProfile) { unsubProfile(); unsubProfile = null; }
      if (unsubAll) { unsubAll(); unsubAll = null; }
      if (unsubUser) { unsubUser(); unsubUser = null; }

      setUser(u);
      if (u) {
        setIsAdmin(ADMIN_EMAILS.includes(u.email || ""));
        
        // Listen to User Profile for discount and learning path stats
        const userRef = doc(db, 'usuarios', u.uid);
        unsubProfile = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setDiscountActive(data.descuento_activo || false);
            setAtaquesTotales(data.ataques_totales || 0);
            
            const todayStr = new Date().toISOString().split('T')[0];
            if (data.fecha_ataques === todayStr) {
              setAtaquesHoy(data.ataques_hoy || 0);
            } else {
              setAtaquesHoy(0);
            }
          } else {
            setDoc(userRef, { 
              email: u.email, 
              descuento_activo: false,
              ataques_totales: 0,
              ataques_hoy: 0,
              fecha_ataques: ""
            }).catch((e) => {
              handleFirestoreError(e, OperationType.WRITE, `usuarios/${u.uid}`);
            });
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `usuarios/${u.uid}`);
        });

        // Listen to Inventory
        if (ADMIN_EMAILS.includes(u.email || "")) {
          // Admin sees all chips globally to manage
          const qAll = collection(db, 'inventario_disponible');
          unsubAll = onSnapshot(qAll, (snap) => {
            setAllChips(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, 'inventario_disponible');
          });
        }
        
        // Everyone sees their own chips
        const qUser = query(collection(db, 'inventario_disponible'), where("owner_id", "==", u.uid));
        unsubUser = onSnapshot(qUser, (snap) => {
          setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'inventario_disponible');
        });

      } else {
        setIsAdmin(false);
        setInventory([]);
        setAllChips([]);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubAll) unsubAll();
      if (unsubUser) unsubUser();
    };
  }, []);

  // Captura del UID de la URL (Deep Link) para sincronización automática y sincronización de pestañas secundarias
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uidFromUrl = params.get("uid");
    if (uidFromUrl) {
      const cleanUid = uidFromUrl.trim();
      localStorage.setItem("pending_uid", cleanUid);
      console.log(`Deep Link detectado. UID pendiente almacenado: ${cleanUid}`);
      
      // Intentamos sincronizar con otra pestaña activa para no abrir ventanas duplicadas
      try {
        const channel = new BroadcastChannel('neoforja_nfc_sync');
        channel.postMessage({ type: 'NFC_SCANNED', uid: cleanUid });
        
        let ackReceived = false;
        const handleAck = (event: MessageEvent) => {
          if (event.data && event.data.type === 'NFC_ACK' && event.data.uid === cleanUid) {
            ackReceived = true;
            console.log("¡Otra pestaña activa confirmó la recepción del chip!");
            setTabSyncedElsewhere(true);
            localStorage.removeItem("pending_uid");
          }
        };
        channel.addEventListener('message', handleAck);
        
        setTimeout(() => {
          if (ackReceived) {
            try {
              window.close();
            } catch (e) {
              console.log("No se pudo cerrar la pestaña automáticamente por seguridad del navegador.", e);
            }
          }
          channel.close();
        }, 1000);
      } catch (err) {
        console.error("BroadcastChannel error:", err);
      }

      // Limpiamos el parámetro de la URL para evitar reclamaciones duplicadas por recarga accidental
      const url = new URL(window.location.href);
      url.searchParams.delete("uid");
      window.history.replaceState({}, document.title, url.toString());
    }
  }, []);

  // Escucha de BroadcastChannel para la pestaña principal (receptora)
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('neoforja_nfc_sync');
      const handleIncomingScan = async (event: MessageEvent) => {
        if (event.data && event.data.type === 'NFC_SCANNED') {
          const scannedUid = event.data.uid;
          console.log(`[BROADCAST] Recibido NFC_SCANNED para Chip ID: ${scannedUid}`);
          
          // Enviamos acuse de recibo de inmediato para la pestaña secundaria
          channel.postMessage({ type: 'NFC_ACK', uid: scannedUid });
          
          if (user) {
            showSystemToast(`Procesando vinculación remota del chip ${scannedUid}...`, "SINCRONIZACIÓN DE RED");
            const success = await claimPhysicalChip(scannedUid);
            if (success) {
              if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
              }
            }
          } else {
            localStorage.setItem("pending_uid", scannedUid);
            showSystemToast(`Se detectó un escaneo de Chip (${scannedUid}). Inicia sesión en esta pestaña principal para vincularlo a tu firma digital.`, "SESIÓN PRINCIPAL REQUERIDA");
          }
        }
      };
      
      channel.addEventListener('message', handleIncomingScan);
      return () => {
        channel.removeEventListener('message', handleIncomingScan);
        channel.close();
      };
    } catch (e) {
      console.error("Error setting up BroadcastChannel listener:", e);
    }
  }, [user, inventory]);

  // Procesamiento del UID de sincronización pendiente al iniciar sesión con Google
  useEffect(() => {
    if (user) {
      const pendingUid = localStorage.getItem("pending_uid");
      if (pendingUid) {
        console.log(`Procesando UID de sincronización pendiente: ${pendingUid}`);
        claimPhysicalChip(pendingUid).then((success) => {
          if (success) {
            localStorage.removeItem("pending_uid");
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
          }
        });
      }
    }
  }, [user]);

  // Web NFC & Fullscreen Handlers
  const triggerVibration = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleEnterFullscreen = () => {
    triggerVibration();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting fullscreen", err);
      });
    }
  };

  const toggleFullscreen = () => {
    triggerVibration();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error entering fullscreen", err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error("Error exiting fullscreen", err);
      });
    }
  };

  // Card Interactions
  const toggleFlip = (chipId: string) => {
    triggerVibration();
    playClickSound();
    setFlippedCards(prev => ({ ...prev, [chipId]: !prev[chipId] }));
  };

  const triggerAttack = async (chipId: string, rarity: string, animClass: string, attackIndex: 'A' | 'B') => {
    // Daily attack clicks limit (Senda de Aprendizaje: Max 15 per day)
    const MAX_DAILY_ATTACKS = 15;
    if (user && ataquesHoy >= MAX_DAILY_ATTACKS) {
      playErrorSound();
      showSystemToast(`Límite diario de entrenamiento alcanzado (${MAX_DAILY_ATTACKS}/${MAX_DAILY_ATTACKS} ataques). ¡Vuelve mañana para seguir forjando tu senda de aprendizaje y desbloquear modificadores visuales!`, "LÍMITE DE SENDA ALCANZADO");
      return;
    }

    const localSnap = inventory.find(c => c.id === chipId);
    const charName = localSnap ? localSnap.personaje : "";

    // Play cyber synth sound depending on chosen attack index
    if (attackIndex === 'A') {
      playAttackASound(charName);
    } else {
      playAttackBSound(charName);
    }

    if (user) {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const userRef = doc(db, 'usuarios', user.uid);
        const chipRef = doc(db, 'inventario_disponible', chipId);
        
        const chipSnap = await getDoc(chipRef);
        if (chipSnap.exists()) {
          const chipData = chipSnap.data();
          const currentLevel = chipData.level || 1;
          const currentExp = chipData.exp || 0;
          
          const nextExp = currentExp + 1;
          const expNeeded = currentLevel * 10;
          
          let didLevelUp = false;
          let newLevel = currentLevel;
          let finalExp = nextExp;
          
          if (nextExp >= expNeeded) {
            didLevelUp = true;
            newLevel = currentLevel + 1;
            finalExp = 0;
          }
          
          const nextAtaquesHoy = ataquesHoy + 1;
          const nextAtaquesTotales = ataquesTotales + 1;
          
          // 1. Update user profile
          await updateDoc(userRef, {
            ataques_hoy: nextAtaquesHoy,
            fecha_ataques: todayStr,
            ataques_totales: nextAtaquesTotales
          });
          
          // 2. Update chip stats
          await updateDoc(chipRef, {
            exp: finalExp,
            level: newLevel,
            ataques_recibidos: (chipData.ataques_recibidos || 0) + 1
          });
          
          if (didLevelUp) {
            setLevelUpChipId(chipId);
            setLevelUpPrevLevel(currentLevel);
            setLevelUpNewLevel(newLevel);
            setShowLevelUpActive(true);
            
            // Cyber sonic level up alert
            setTimeout(() => {
              playLevelUpSound();
            }, 100);

            if (navigator.vibrate) {
              navigator.vibrate([100, 50, 100, 50, 300]);
            }
            showSystemToast(`¡CHIP CALIBRADO! El microprocesador del personaje ha subido al NIVEL ${newLevel}. sus atributos de velocidad y energía han aumentado de forma permanente.`, "¡MICROPROCESADOR MEJORADO!");
          }
        }
      } catch (e: any) {
        handleFirestoreError(e, OperationType.WRITE, `inventario_disponible/${chipId}`);
      }
    }

    // Custom responsive vibration patterns mapped directly to character card rarity
    if (navigator.vibrate) {
      if (rarity === "Legendario") {
        navigator.vibrate([100, 50, 150, 50, 200]);
      } else if (rarity === "Épico") {
        navigator.vibrate([80, 40, 100]);
      } else if (rarity === "Raro") {
        navigator.vibrate([60, 30, 60]);
      } else {
        navigator.vibrate(40);
      }
    } else {
      triggerVibration();
    }

    // Assign shaking class on card container
    const shakeClass = rarity === "Legendario" ? "shake-power-legendario" : rarity === "Épico" ? "shake-power-epico" : "";
    if (shakeClass) {
      setShakingCards(prev => ({ ...prev, [chipId]: shakeClass }));
      setTimeout(() => {
        setShakingCards(prev => {
          const r = { ...prev };
          delete r[chipId];
          return r;
        });
      }, 600);
    }

    // Spawn interactive flash overlay
    setImpactFlashes(prev => ({ ...prev, [chipId]: { type: rarity, attackIndex, key: Date.now() } }));
    setTimeout(() => {
      setImpactFlashes(prev => {
        const r = { ...prev };
        delete r[chipId];
        return r;
      });
    }, 850);

    // Run active image motion transformation
    setAnimatingChips(prev => ({ ...prev, [chipId]: animClass }));
    setTimeout(() => {
      setAnimatingChips(prev => {
        const reset = { ...prev };
        delete reset[chipId];
        return reset;
      });
    }, 650);
  };

  const reciclarChipUsuario = async (chipId: string) => {
    if (!user) return;
    triggerVibration();
    playRecycleSound();
    try {
      const chipRef = doc(db, 'inventario_disponible', chipId);
      const chipSnap = await getDoc(chipRef);
      if (!chipSnap.exists()) return;
      
      const chipData = chipSnap.data();
      const expDeduction = conseguirExpAcumulada(chipData);
      
      // Free the chip & reset experience stats
      await updateDoc(chipRef, { 
        owner_id: null,
        level: 1,
        exp: 0,
        ataques_recibidos: 0,
        fused_chips: [],
        fused_into_id: null,
        modificador_visual: ""
      });
      
      // Deduct from the user & give reward discount
      const userRef = doc(db, 'usuarios', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currTotales = userSnap.data().ataques_totales || 0;
        await updateDoc(userRef, {
          ataques_totales: Math.max(0, currTotales - expDeduction)
        });
      }
      
      showSystemToast(`Ficha #${chipId} liberada con éxito. Se ha descontado la EXP acumulada de tu Senda de Aprendizaje (-${expDeduction} ★).`, "RECALIBRACIÓN DE EQUIPO Completada");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `inventario_disponible/${chipId}`);
    }
  };

  // Claim a physical purchased chip to the logged-in user
  const claimPhysicalChip = async (chipId: string): Promise<boolean> => {
    if (!user) {
      showSystemToast("Debes iniciar sesión para vincular un chip.", "SISTEMA PROTEGIDO");
      return false;
    }
    const cleanId = chipId.trim();
    if (!cleanId) {
      showSystemToast("Número de serie inválido.", "FORMATO INVÁLIDO");
      return false;
    }
    triggerVibration();
    handleEnterFullscreen();
    try {
      let chipRef = doc(db, 'inventario_disponible', cleanId);
      let chipSnap = await getDoc(chipRef);
      let matchedId = cleanId;

      if (!chipSnap.exists()) {
        // Fallback 1: probar en mayúsculas (muy común en hardware de grabación)
        const upperId = cleanId.toUpperCase();
        chipRef = doc(db, 'inventario_disponible', upperId);
        chipSnap = await getDoc(chipRef);
        if (chipSnap.exists()) {
          matchedId = upperId;
        } else {
          // Fallback 2: probar en minúsculas (formato clásico de lectura de teléfonos de antena)
          const lowerId = cleanId.toLowerCase();
          chipRef = doc(db, 'inventario_disponible', lowerId);
          chipSnap = await getDoc(chipRef);
          if (chipSnap.exists()) {
            matchedId = lowerId;
          }
        }
      }

      if (!chipSnap.exists()) {
        playErrorSound();
        showSystemToast(`FALLO DE ENLACE: La serie "${cleanId}" no existe en el sistema o no está registrada por el administrador en NeoForja.`, "ERROR DE ENLACE DE RED");
        return false;
      }

      const data = chipSnap.data();
      if (data.owner_id) {
        if (data.owner_id === user.uid) {
          playClickSound();
          showSystemToast(`Este chip (${data.personaje}) ya está vinculado a tu cuenta.`, "SITUACIÓN CONFIRMADA");
          return true;
        } else {
          if (isAdmin) {
             const confirmRecycle = window.confirm(`OPERACIÓN ADMIN: Este chip (${data.personaje}) pertenece a otro usuario. ¿Deseas RECICLARLO / Liberarlo?`);
             if (confirmRecycle) {
               await adminRecyclePhysicalChip(matchedId);
               return true;
             }
             return false;
          }
          playErrorSound();
          showSystemToast("ALERTA DE SEGURIDAD: Este chip ya ha sido reclamado por otra firma digital en NeoForja.", "RESTRICCIÓN DE SEGURIDAD");
          return false;
        }
      }

      // Link ownership using exact matched document path
      await updateDoc(chipRef, { owner_id: user.uid });
      playSyncSuccessSound();
      showSystemToast(`¡Sincronización Completada! ${data.personaje} (# ${matchedId}) ahora pertenece a tu escuadrón.`, "VÍNCULO EXITOSO");
      setTimeout(() => {
        aplicarSinergiaAlbum(matchedId, data.personaje);
      }, 500);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `inventario_disponible/${cleanId}`);
      return false;
    }
  };

  // Web NFC standard reader integration
  const startNFCScan = async () => {
    setNfcReading(true);
    setNfcError("");
    setNfcSuccessMsg("");
    triggerVibration();

    if ('NDEFReader' in window) {
      try {
        const ndef = new (window as any).NDEFReader();
        await ndef.scan();
        ndef.onreading = (event: any) => {
          triggerVibration();
          handleEnterFullscreen();
          const serialNumber = event.serialNumber;
          if (serialNumber) {
            claimPhysicalChip(serialNumber).then((success) => {
              if (success) {
                setNfcSuccessMsg(`¡Sincronizado con éxito vía NFC! ID: ${serialNumber}`);
                setNfcReading(false);
              } else {
                setNfcError("No se pudo vincular el chip detectado.");
                setNfcReading(false);
              }
            });
          } else {
            setNfcError("Lectura NFC completada pero no se detectó número de serie.");
            setNfcReading(false);
          }
        };
      } catch (error: any) {
        setNfcError(`Error de hardware NFC: ${error.message || error}`);
        setNfcReading(false);
      }
    } else {
      setNfcError("Web NFC no está soportado en este dispositivo/navegador. Usa la simulación inferior o el scanner.");
    }
  };

  const adminRecyclePhysicalChip = async (chipId: string) => {
    if (!isAdmin) return;
    const chipRef = doc(db, 'inventario_disponible', chipId);
    try {
      const chipSnap = await getDoc(chipRef);
      if (chipSnap.exists()) {
        const chipData = chipSnap.data();
        const previousOwner = chipData.owner_id;
        const expDeduction = conseguirExpAcumulada(chipData);
        
        // Free the chip & reset stats
        await updateDoc(chipRef, { 
          owner_id: null,
          level: 1,
          exp: 0,
          ataques_recibidos: 0,
          fused_chips: [],
          fused_into_id: null,
          modificador_visual: ""
        });
        
        // Subtract exp from the previous owner
        if (previousOwner) {
          const userRef = doc(db, 'usuarios', previousOwner);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const currTotales = userSnap.data().ataques_totales || 0;
            await updateDoc(userRef, { 
              ataques_totales: Math.max(0, currTotales - expDeduction) 
            });
          }
          showSystemToast(`Ficha liberada del escuadrón. Se descontó la exp acumulada (-${expDeduction} ★).`, "PROTOCOLO DE RECICLAJE COMPLETO");
        } else {
          showSystemToast("Esta ficha ya estaba libre, pero se ha confirmado y reinstalado en la tienda central con éxito.", "SOCIABILIZACIÓN COMPLETADA");
        }
      } else {
        showSystemToast("El chip físico a reciclar no existe en el sistema NeoForja.", "REGISTRO INEXISTENTE");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `inventario_disponible/${chipId}`);
    }
  };

  // Scanner logic
  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scanner.render(async (decodedText) => {
        scanner.clear();
        setShowScanner(false);
        triggerVibration();
        
        let chipId = "";
        let isTransferObject = false;
        let parsed: any = null;
        try {
          parsed = JSON.parse(decodedText);
          if (parsed && parsed.type === "QR_TRANSFER" && parsed.chipId) {
            isTransferObject = true;
            chipId = parsed.chipId;
          } else {
            chipId = decodedText.trim();
          }
        } catch (e) {
          chipId = decodedText.trim();
        }

        if (scannerMode === 'CLAIM_CHIP') {
          // Reclamar chip nuevo (físico) comprado por el usuario
          claimPhysicalChip(chipId);
          return;
        }

        if (scannerMode === 'TRANSFER') {
          if (!isTransferObject) {
            showSystemToast("QR Inválido para transferencia. Debe ser un QR generado de transferencia P2P.", "ERROR DE PROTOCOLO");
            return;
          }
          const chipRef = doc(db, 'inventario_disponible', chipId);
          try {
            const chipSnap = await getDoc(chipRef);
            if (chipSnap.exists()) {
               const chipData = chipSnap.data();
               const previousOwner = chipData.owner_id;
               
               if (previousOwner) {
                 if (previousOwner === user?.uid) {
                   showSystemToast("Este chip ya está asignado a tu red central.", "SITUACIÓN REPETIDA");
                   return;
                 }
                 
                 const expDeduction = conseguirExpAcumulada(chipData);
                 
                 // 1. Deduct from previous owner
                 const prevUserRef = doc(db, 'usuarios', previousOwner);
                 const prevUserSnap = await getDoc(prevUserRef);
                 if (prevUserSnap.exists()) {
                   const prevTotales = prevUserSnap.data().ataques_totales || 0;
                   await updateDoc(prevUserRef, {
                     ataques_totales: Math.max(0, prevTotales - expDeduction)
                   });
                 }
                 
                 // 2. Add to new owner (current user)
                 if (user) {
                   const nextUserRef = doc(db, 'usuarios', user.uid);
                   const nextUserSnap = await getDoc(nextUserRef);
                   if (nextUserSnap.exists()) {
                     const nextTotales = nextUserSnap.data().ataques_totales || 0;
                     await updateDoc(nextUserRef, {
                       ataques_totales: nextTotales + expDeduction
                     });
                   }
                 }
               }
               
               // Transfer Ownership to currentUser
               await updateDoc(chipRef, { owner_id: user?.uid });
               showSystemToast(`¡Chip transferido exitosamente! Senda de Aprendizaje adaptada (+${conseguirExpAcumulada(chipData)} ★).`, "TRANSFERENCIA DE FIRMA COMPLETA");
               setTimeout(() => {
                 aplicarSinergiaAlbum(chipId, chipData.personaje);
               }, 500);
            } else {
               showSystemToast("Este chip no tiene un propietario activo para transferir.", "DISPOSITIVO DEZINCULADO");
            }
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `inventario_disponible/${chipId}`);
          }
        }
        
        if (scannerMode === 'ADMIN_RECYCLE' && isAdmin) {
          // Admin Recycling
          const chipRef = doc(db, 'inventario_disponible', chipId);
          try {
            const chipSnap = await getDoc(chipRef);
            if (chipSnap.exists()) {
               const chipData = chipSnap.data();
               const previousOwner = chipData.owner_id;
               const expDeduction = conseguirExpAcumulada(chipData);
               
               // Free the chip & reset stats
               await updateDoc(chipRef, { 
                 owner_id: null,
                 level: 1,
                 exp: 0,
                 ataques_recibidos: 0,
                 fused_chips: [],
                 fused_into_id: null,
                 modificador_visual: ""
               });
               
               // Subtract exp from the previous owner
               if (previousOwner) {
                 const userRef = doc(db, 'usuarios', previousOwner);
                 const userSnap = await getDoc(userRef);
                 if (userSnap.exists()) {
                   const currTotales = userSnap.data().ataques_totales || 0;
                   await updateDoc(userRef, { 
                     ataques_totales: Math.max(0, currTotales - expDeduction) 
                   });
                 }
                 showSystemToast(`Ficha liberada del escuadrón. Se descontó la exp acumulada (-${expDeduction} ★).`, "PROTOCOLO DE RECICLAJE COMPLETO");
               } else {
                 showSystemToast("Esta ficha ya estaba libre, pero se ha confirmado y reinstalado en la tienda central con éxito.", "SOCIABILIZACIÓN COMPLETADA");
               }
            } else {
               showSystemToast("El chip físico a reciclar no existe en el sistema NeoForja.", "REGISTRO INEXISTENTE");
            }
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `inventario_disponible/${chipId}`);
          }
        }
      }, (err) => { /* ignore */ });
      return () => { scanner.clear().catch(e => console.error(e)); };
    }
  }, [showScanner, scannerMode, isAdmin, user]);

  const RenderCard = ({ chip }: { chip: any }) => {
    const char = CHAR_DATA[chip.personaje];
    if (!char) return null;
    const isFlipped = flippedCards[chip.id] || false;
    const animClass = animatingChips[chip.id] ? `animate-${animatingChips[chip.id]}` : '';
    const config = getRarityConfig(char.type);
    const activeFlash = impactFlashes[chip.id];

    // Character Fusion Levels and Stats Escalation
    const level = chip.level || 1;
    const levelMultiplier = 1 + 0.1 * (level - 1);
    const scaledVel = Math.round(char.vel * levelMultiplier * 10) / 10;
    const scaledEn = Math.round(char.en * levelMultiplier * 10) / 10;

    // Visual Modifiers styling
    const activeMod = chip.modificador_visual || "";
    const activeModClass = (activeMod === "helio" || activeMod === "void" || activeMod === "quantum") ? `mod-${activeMod}` : "";

    // Grouping user duplicate units of the SAME character to enable fusion
    const duplicates = inventory.filter(c => c.personaje === chip.personaje && c.id !== chip.id && c.owner_id === user?.uid);

    // Calculate attacks specific to this character owned by the user
    const ataquesTotalesPersonaje = inventory
      .filter(c => c.personaje === chip.personaje)
      .reduce((sum, curr) => sum + (curr.ataques_recibidos || 0), 0);

    // Resilient inline step-by-step confirmation states
    const [recycleState, setRecycleState] = useState<'idle' | 'confirming'>('idle');
    const [fusionState, setFusionState] = useState<'idle' | 'confirming'>('idle');
    const [unmergeState, setUnmergeState] = useState<'idle' | 'confirming'>('idle');

    return (
      <div className="w-full max-w-sm mx-auto h-[450px] perspective-1000 my-4" onClick={() => handleEnterFullscreen()}>
        <div className={`flip-card w-full h-full ${isFlipped ? 'flipped' : ''} ${shakingCards[chip.id] || ''}`}>
          <div className="flip-card-inner">
            
            {/* FRONT */}
            <div className={`flip-card-front ${config.cardClass} ${activeModClass} flex flex-col p-4 relative overflow-hidden group rounded-lg transition-all duration-300`}>
              {/* Scanline overlay custom reward effect */}
              {activeMod === "scanline" && <div className="absolute inset-0 pointer-events-none z-15 mod-scanline" />}

              {/* Cybernetic Corner Decorations */}
              <span className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${config.cornerBorder} opacity-80`}></span>
              <span className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 ${config.cornerBorder} opacity-80`}></span>
              <span className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 ${config.cornerBorder} opacity-80`}></span>
              <span className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${config.cornerBorder} opacity-80`}></span>

              {/* Rarity and Chip details */}
              <div className="flex justify-between items-center relative z-10">
                <span className="text-[10px] font-mono tracking-wider opacity-60 text-white"># {chip.id}</span>
                <div className="flex gap-1.5 items-center">
                  {level > 1 && (
                    <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 bg-amber-500 text-black rounded tracking-wider shadow-[0_0_8px_rgba(245,158,11,0.8)]">
                      LVL {level}
                    </span>
                  )}
                  <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 border rounded ${config.badgeBg} tracking-wide`}>
                    {char.type}
                  </span>
                </div>
              </div>
              
              <h3 className={`glitch-text text-2xl text-center mt-2 mb-1 ${config.textClass} cursor-pointer transition-all hover:scale-105`} onClick={(e) => { e.stopPropagation(); toggleFlip(chip.id); }}>
                {chip.personaje}
              </h3>
              
              <div className="flex-grow flex items-center justify-center relative cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleFlip(chip.id); }}>
                <img src={char.img} alt={chip.personaje} className={`h-44 object-contain transition-transform group-hover:scale-110 z-10 relative ${animClass}`} />
                <div className={`absolute inset-0 ${config.glowBg} blur-2xl opacity-60 rounded-full transition-all duration-1000 group-hover:opacity-80 group-hover:scale-110`}></div>
              </div>

              {/* Battle Impact Flash Overlay */}
              {activeFlash && (
                <div key={activeFlash.key} className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center overflow-hidden rounded-lg">
                  {activeFlash.type === "Legendario" && (
                    <>
                      {/* Legendary Nova */}
                      <div className="absolute inset-0 bg-amber-500/25 animate-pulse duration-75" />
                      <div className="w-16 h-16 rounded-full bg-amber-400 opacity-80 border-2 border-amber-200 scale-[8] animate-ping duration-500" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-1.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent rotate-45 scale-150 animate-pulse" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-1.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent -rotate-45 scale-150 animate-pulse" />
                      <div className="text-[10px] uppercase tracking-widest text-[#000] font-mono font-extrabold absolute bottom-16 px-2.5 py-1 bg-amber-400 border border-white rounded shadow-[0_0_15px_rgba(245,158,11,0.8)] text-center max-w-[90%]">
                        {activeFlash.attackIndex === 'A' ? char.attackA.name : char.attackB.name}
                      </div>
                    </>
                  )}
                  {activeFlash.type === "Épico" && (
                    <>
                      {/* Epic Plasma */}
                      <div className="absolute inset-0 bg-fuchsia-500/20" />
                      <div className="w-20 h-20 border-2 border-fuchsia-500 rounded-sm rotate-45 scale-[5] animate-ping duration-500" />
                      <div className="absolute inset-x-0 h-4 bg-[#ff0077]/30 border-y-2 border-[#ff0077] rotate-12 scale-150" />
                      <div className="text-[10px] uppercase tracking-widest text-white font-mono font-extrabold absolute bottom-16 px-2.5 py-1 bg-fuchsia-600 border border-fuchsia-300 rounded shadow-[0_0_15px_rgba(217,70,239,0.8)] text-center max-w-[90%]">
                        {activeFlash.attackIndex === 'A' ? char.attackA.name : char.attackB.name}
                      </div>
                    </>
                  )}
                  {activeFlash.type === "Raro" && (
                    <>
                      {/* Rare Kinetic */}
                      <div className="absolute inset-0 bg-blue-500/20" />
                      <div className="w-24 h-24 border-2 border-blue-400 rounded-full scale-[4] animate-ping duration-500" />
                      <div className="w-16 h-16 border-2 border-indigo-400 rounded-full scale-[2.5] animate-ping duration-500" />
                      <div className="text-[10px] uppercase tracking-widest text-blue-300 font-mono font-extrabold absolute bottom-16 px-2.5 py-1 bg-black/90 border border-blue-500/40 rounded shadow-[0_0_12px_rgba(59,130,246,0.3)] text-center max-w-[90%]">
                        {activeFlash.attackIndex === 'A' ? char.attackA.name : char.attackB.name}
                      </div>
                    </>
                  )}
                  {activeFlash.type === "Común" && (
                    <>
                      {/* Common Static */}
                      <div className="absolute inset-0 bg-cyan-500/15 animate-ping duration-300" />
                      <div className="absolute inset-4 rounded-lg border border-cyan-500/30 animate-pulse pointer-events-none" />
                      <div className="text-[10px] uppercase tracking-widest text-cyan-300 font-mono font-extrabold absolute bottom-16 px-2.5 py-1 bg-black/90 border border-cyan-500/40 rounded shadow-[0_0_10px_rgba(6,182,212,0.3)] text-center max-w-[90%]">
                        {activeFlash.attackIndex === 'A' ? char.attackA.name : char.attackB.name}
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {/* Individual Chip EXP Bar */}
              <div className="mt-2 text-[9px] font-mono relative z-20 bg-black/45 p-1 rounded border border-cyan-500/10">
                <div className="flex justify-between text-cyan-300 mb-0.5 px-0.5">
                  <span>EXP COMBATE:</span>
                  <span className="font-bold text-amber-400">{(chip.exp || 0)} / {(level * 10)} EXP</span>
                </div>
                <div className="w-full bg-cyan-950/70 rounded h-1.5 overflow-hidden border border-cyan-500/10">
                  <div 
                    className="bg-gradient-to-r from-cyan-400 to-amber-500 h-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, ((chip.exp || 0) / (level * 10)) * 100)}%` }} 
                  />
                </div>
              </div>

              <div className="flex justify-between gap-2 mt-3 relative z-20">
                 <button onClick={(e) => { e.stopPropagation(); triggerAttack(chip.id, char.type, char.attackA.anim, 'A') }} className={`flex-grow border py-2 px-1 text-[10px] font-bold font-mono transition-all duration-300 cursor-pointer shadow-[0_0_8px_rgba(0,0,0,0.5)] active:scale-95 text-center truncate ${config.btnAClass}`} title={char.attackA.name}>
                   {char.attackA.name}
                 </button>
                 <button onClick={(e) => { e.stopPropagation(); triggerAttack(chip.id, char.type, char.attackB.anim, 'B') }} className={`flex-grow border py-2 px-1 text-[10px] font-bold font-mono transition-all duration-300 cursor-pointer shadow-[0_0_8px_rgba(0,0,0,0.5)] active:scale-95 text-center truncate ${config.btnBClass}`} title={char.attackB.name}>
                   {char.attackB.name}
                 </button>
              </div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); setShowQRModal({ active: true, uid: chip.id, charName: chip.personaje }); triggerVibration(); }} 
                className={`mt-2 w-full border border-white/20 bg-white/5 hover:bg-white/15 text-white/90 py-1.5 text-xs font-bold font-mono flex items-center justify-center gap-2 rounded transition-all active:scale-98`}>
                <QrCode className="w-3.5 h-3.5" /> TRANSFERIR CHIP
              </button>
            </div>

            {/* BACK */}
            <div className={`flip-card-back ${config.cardClass} ${activeModClass} p-5 flex flex-col justify-between rounded-lg relative transition-all duration-300`} onClick={() => toggleFlip(chip.id)}>
              {/* Scanline overlay custom reward effect */}
              {activeMod === "scanline" && <div className="absolute inset-0 pointer-events-none z-15 mod-scanline" />}

              {/* Cybernetic Corner Decorations */}
              <span className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${config.cornerBorder} opacity-80`}></span>
              <span className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 ${config.cornerBorder} opacity-80`}></span>
              <span className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 ${config.cornerBorder} opacity-80`}></span>
              <span className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${config.cornerBorder} opacity-80`}></span>

              <div>
                <h3 className={`glitch-text text-lg text-center ${config.textClass}`}>
                  {chip.personaje} {level > 1 ? `// NIVEL ${level}` : "// CORE"}
                </h3>
                
                <div className="space-y-2 mt-3 font-mono text-xs text-cyan-200">
                  <div className="flex items-center gap-2"><Shield size={14} className="text-orange-500"/> <span className="font-bold text-orange-400">CLASE:</span> {char.class}</div>
                  
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-orange-500"/> 
                    <span className="font-bold text-orange-400">VELOCIDAD:</span> 
                    <span>
                      {char.vel} 
                      {level > 1 && <span className="text-amber-400 font-extrabold ml-1">➜ {scaledVel}</span>}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-cyan-500"/> 
                    <span className="font-bold text-cyan-400">ENERGÍA:</span> 
                    <span>
                      {char.en} 
                      {level > 1 && <span className="text-amber-400 font-extrabold ml-1">➜ {scaledEn}</span>}
                    </span>
                  </div>
                  
                  <div className="pt-1.5 border-t border-cyan-900/50">
                    <span className={`${config.textClass} font-bold block mb-0.5 text-[10px] tracking-wider uppercase`}>Habilidad Pasiva</span> 
                    <span className="text-white text-[11px] leading-tight block">{char.passive}</span>
                  </div>
                </div>
              </div>

              {/* Duplicate fusion / Unmerge commands AND Style modifiers */}
              <div className="space-y-2 pt-2 border-t border-cyan-900/40 mt-1" onClick={(e) => e.stopPropagation()}>
                {/* Fusion Trigger */}
                {duplicates.length > 0 && (
                  <div>
                    {fusionState === 'idle' ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setFusionState('confirming');
                          setTimeout(() => setFusionState('idle'), 4000);
                        }}
                        className="w-full py-1.5 text-[10px] border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 font-bold font-mono transition-all rounded cursor-pointer leading-none">
                        ⚡ FUSIONAR DUPLICADO ({duplicates.length})
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setFusionState('idle');
                          const dup = duplicates[0];
                          fusionarChips(chip.id, dup.id);
                        }}
                        className="w-full py-1.5 text-[9px] border-2 border-amber-500 bg-amber-500 hover:bg-amber-600 text-black font-black font-mono transition-all rounded cursor-pointer leading-none flex items-center justify-center animate-pulse">
                        ⚠️ CONFIRMAR ACOPLE DE DUPLICADO
                      </button>
                    )}
                  </div>
                )}

                {/* Defusion Trigger */}
                {level > 1 && (
                  <div>
                    {unmergeState === 'idle' ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setUnmergeState('confirming');
                          setTimeout(() => setUnmergeState('idle'), 4000);
                        }}
                        className="w-full py-1.5 text-[10px] border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 font-bold font-mono transition-all rounded cursor-pointer leading-none">
                        🧬 DESFUSIONAR SEÑAL
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setUnmergeState('idle');
                          desfusionarChip(chip.id);
                        }}
                        className="w-full py-1.5 text-[9px] border-2 border-rose-500 bg-rose-600 hover:bg-rose-700 text-white font-black font-mono transition-all rounded cursor-pointer leading-none flex items-center justify-center animate-pulse">
                        🧬 CONFIRMAR DESACOPLE
                      </button>
                    )}
                  </div>
                )}

                {/* Unlockable Custom aesthetics select */}
                {ataquesTotalesPersonaje >= 5 && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-mono font-bold text-cyan-400/80 uppercase">MODIFICADOR ESTÉTICO (PERSONAJE: {ataquesTotalesPersonaje} ★):</span>
                    <select
                      value={chip.modificador_visual || ""}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => cambiarModificadorVisual(chip.id, e.target.value)}
                      className="w-full bg-black/90 border border-cyan-500/30 text-cyan-300 py-0.5 px-1 text-[10px] font-mono rounded cursor-pointer focus:outline-none"
                    >
                      <option value="">[ ESTÁNDAR (SINFÍN) ]</option>
                      {ataquesTotalesPersonaje >= 5 && <option value="scanline">⚡ ESCÁNER TÁCTICO (★ 5)</option>}
                      {ataquesTotalesPersonaje >= 15 && <option value="helio">🔥 FLUJO DE HELIO (★ 15)</option>}
                      {ataquesTotalesPersonaje >= 30 && <option value="void">👾 SOBRECARGA DE VACÍO (★ 30)</option>}
                      {ataquesTotalesPersonaje >= 50 && <option value="quantum">🌀 FUSIÓN CUÁNTICA (★ 50)</option>}
                    </select>
                  </div>
                )}

                {/* User direct recycling button */}
                {chip.owner_id === user?.uid && (
                  <div>
                    {recycleState === 'idle' ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecycleState('confirming');
                          setTimeout(() => setRecycleState('idle'), 4500);
                        }}
                        className="w-full py-2 text-[9px] border border-red-500/30 bg-red-500/10 hover:bg-red-500/25 text-red-400 font-bold font-mono transition-all rounded cursor-pointer leading-none flex items-center justify-center gap-1">
                        <Trash2 className="w-3 h-3" /> LIBERAR / RECICLAR CHIP (-{(level - 1) * 10 + (chip.exp || 0)} ★)
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecycleState('idle');
                          reciclarChipUsuario(chip.id);
                        }}
                        className="w-full py-2 text-[9px] border-2 border-red-500 bg-red-650 hover:bg-red-750 text-white font-black font-mono transition-all rounded cursor-pointer leading-none flex flex-col items-center justify-center gap-1 animate-pulse">
                        <span className="text-[10px]">⚠️ CONFIRMAR LIBERACIÓN (-{(level - 1) * 10 + (chip.exp || 0)} ★)</span>
                        <span className="text-[7.5px] font-normal tracking-wide opacity-90">[ CLICK SEGUNDO APTO ]</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              
            </div>

          </div>
        </div>
      </div>
    );
  };

  const fusionarChips = async (parentChipId: string, childChipId: string) => {
    if (!user) return;
    triggerVibration();
    playSyncSuccessSound();
    try {
      const parentRef = doc(db, 'inventario_disponible', parentChipId);
      const childRef = doc(db, 'inventario_disponible', childChipId);
      
      const parentSnap = await getDoc(parentRef);
      const childSnap = await getDoc(childRef);
      
      if (!parentSnap.exists() || !childSnap.exists()) {
        showSystemToast("No se pudo hallar la referencia de las fichas en el sistema.", "ERROR DE ENLACE");
        return;
      }
      
      const parentData = parentSnap.data();
      const currentLevel = parentData.level || 1;
      const currentFused = parentData.fused_chips || [];
      
      // Update parent: gain 1 level, save child ID inside fused_chips
      await updateDoc(parentRef, {
        level: currentLevel + 1,
        fused_chips: [...currentFused, childChipId]
      });
      
      // Update child: set owner_id to deactivated (bound to user and parent) and save fused_into_id
      await updateDoc(childRef, {
        owner_id: "fused_" + user.uid,
        fused_into_id: parentChipId
      });
      
      showSystemToast(`Fusión exitosa. Se ha acoplado el chip # ${childChipId} al núcleo central de # ${parentChipId}. ¡El personaje ha subido al Nivel ${currentLevel + 1}!`, "ACOPLAMIENTO LOGRADO");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `inventario_disponible/fusion`);
    }
  };

  const desfusionarChip = async (parentChipId: string) => {
    if (!user) return;
    triggerVibration();
    playRecycleSound();
    try {
      const parentRef = doc(db, 'inventario_disponible', parentChipId);
      const parentSnap = await getDoc(parentRef);
      
      if (!parentSnap.exists()) {
        showSystemToast("No se pudo hallar la ficha origen en NeoForja.", "ERROR DE SEÑAL");
        return;
      }
      
      const parentData = parentSnap.data();
      const currentLevel = parentData.level || 1;
      const currentFused = parentData.fused_chips || [];
      
      if (currentLevel <= 1 || currentFused.length === 0) {
        showSystemToast("Esta ficha no posee fusiones activas en su núcleo central.", "DESACOPLAMIENTO INHABILITADO");
        return;
      }
      
      // Take the last child added
      const childChipId = currentFused[currentFused.length - 1];
      const childRef = doc(db, 'inventario_disponible', childChipId);
      
      // Restore Child chip
      await updateDoc(childRef, {
        owner_id: user.uid,
        fused_into_id: null
      });
      
      // Downgrade Parent chip
      await updateDoc(parentRef, {
        level: currentLevel - 1,
        fused_chips: currentFused.filter((id: string) => id !== childChipId)
      });
      
      showSystemToast(`Separación completada. El chip # ${childChipId} ha sido desafiliado y restaurado en tu inventario activo. El nivel de # ${parentChipId} ahora desciende a ${currentLevel - 1}.`, "CHIP DESCOPLADO");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `inventario_disponible/defusion`);
    }
  };

  const cambiarModificadorVisual = async (chipId: string, modifier: string) => {
    if (!user) return;
    try {
      const chipRef = doc(db, 'inventario_disponible', chipId);
      await updateDoc(chipRef, {
        modificador_visual: modifier || ""
      });
      showSystemToast(`Ecosistema estético del chip calibrado en modo: ${modifier ? modifier.toUpperCase() : "ESTÁNDAR"}`, "PERSONALIZACIÓN DE FIRMA");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `inventario_disponible/${chipId}`);
    }
  };

  const [adminInventoryFilter, setAdminInventoryFilter] = useState<'all' | 'available' | 'claimed'>('all');

  const resetTestingAttacks = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'usuarios', user.uid);
      await updateDoc(userRef, {
        ataques_hoy: 0,
        ataques_totales: 0,
        fecha_ataques: ""
      });
      
      // Also reset levels and exp of all their owned inventory chips to 1 / 0!
      for (const chip of inventory) {
        if (chip.owner_id === user.uid) {
          const chipRef = doc(db, 'inventario_disponible', chip.id);
          await updateDoc(chipRef, {
            level: 1,
            exp: 0,
            ataques_recibidos: 0,
            modificador_visual: ""
          });
        }
      }
      
      showSystemToast("Estadísticas de Senda de Aprendizaje y experiencia de tus chips reiniciadas con éxito para simular el progreso.", "REINICIO TOTAL DE PRUEBAS");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `usuarios/${user.uid}`);
    }
  };

  const assignRandomChip = async () => {
    const chars = Object.keys(CHAR_DATA);
    const randChar = chars[Math.floor(Math.random() * chars.length)];
    const newChipId = "NF-" + Math.floor(Math.random() * 1000000);
    try {
      await setDoc(doc(db, "inventario_disponible", newChipId), {
        personaje: randChar,
        owner_id: user?.uid,
        added_at: new Date().toISOString()
      });
      setTimeout(() => {
        aplicarSinergiaAlbum(newChipId, randChar);
      }, 500);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `inventario_disponible/${newChipId}`);
    }
  }

  const forjarNewChip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUid.trim()) {
      showSystemToast("Es necesario ingresar un UID de serie válido.", "DATOS INCOMPLETOS");
      return;
    }
    const cleanUid = adminUid.trim();
    try {
      const docRef = doc(db, 'inventario_disponible', cleanUid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const confirmOverwrite = window.confirm(`El UID "${cleanUid}" ya existe asignado a "${docSnap.data().personaje}". ¿Deseas sobreescribirlo?`);
        if (!confirmOverwrite) return;
      }
      await setDoc(docRef, {
        personaje: adminChar,
        owner_id: null,
        added_at: new Date().toISOString()
      });
      setLastForgedChip({ id: cleanUid, character: adminChar });
      setAdminUid("");
      triggerVibration();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `inventario_disponible/${cleanUid}`);
    }
  };

  const deleteChipFromSystem = async (chipId: string) => {
    if (primedDeleteId !== chipId) {
      triggerVibration();
      setPrimedDeleteId(chipId);
      return;
    }
    
    triggerVibration();
    try {
      const chipRef = doc(db, 'inventario_disponible', chipId);
      const chipSnap = await getDoc(chipRef);
      if (chipSnap.exists()) {
        const chipData = chipSnap.data();
        const previousOwner = chipData.owner_id;
        const expDeduction = conseguirExpAcumulada(chipData);
        
        if (previousOwner && !previousOwner.startsWith("fused_")) {
          const userRef = doc(db, 'usuarios', previousOwner);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const currTotales = userSnap.data().ataques_totales || 0;
            await updateDoc(userRef, {
              ataques_totales: Math.max(0, currTotales - expDeduction)
            });
          }
        }
      }
      await deleteDoc(doc(db, 'inventario_disponible', chipId));
      setPrimedDeleteId(null);
      triggerVibration();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `inventario_disponible/${chipId}`);
    }
  };

  // Automatically reset primed delete ID after 3.5 seconds
  useEffect(() => {
    if (primedDeleteId) {
      const timer = setTimeout(() => {
        setPrimedDeleteId(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [primedDeleteId]);

  if (loading) {
    return <div className="h-screen bg-black flex items-center justify-center font-mono text-cyan-500">CONECTANDO A LA MATRIZ...</div>;
  }

  if (tabSyncedElsewhere) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-6 text-center font-mono text-cyan-400">
        <div className="max-w-md p-6 border-2 border-cyan-500 bg-cyan-950/20 rounded shadow-[0_0_30px_rgba(6,182,212,0.35)] relative">
          <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-500"></span>
          <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-500"></span>
          <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-500"></span>
          <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-500"></span>
          
          <div className="w-12 h-12 rounded-full border border-cyan-400 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Zap className="text-cyan-400 w-6 h-6" />
          </div>
          
          <h2 className="text-lg font-black tracking-widest text-cyan-300 mb-3 uppercase">¡CONEXIÓN ESTABLECIDA!</h2>
          <p className="text-xs text-white/80 leading-relaxed mb-6">
            Hemos detectado que ya tienes otra pestaña de la NeoForja abierta en este navegador. 
          </p>
          <p className="text-xs text-cyan-400 bg-cyan-950/40 p-3 rounded border border-cyan-500/20 leading-relaxed font-bold mb-6">
            El chip de combate se sincronizó automáticamente y sin esperas en tu pantalla principal de batalla.
          </p>
          <p className="text-[10px] text-white/50 leading-relaxed font-mono">
            Puedes cerrar esta pestaña adicional y continuar tu entrenamiento desde tu ventana ya activa.
          </p>
          
          <button 
            onClick={() => {
              try {
                window.close();
              } catch (e) {
                alert("Puedes cerrar esta pestaña manualmente.");
              }
            }} 
            className="mt-6 w-full bg-cyan-500 text-black py-2.5 rounded font-black text-xs uppercase hover:bg-cyan-400 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            ENTENDIDO Y CERRAR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative z-0">
      {/* Background elements are handled in CSS via body::before */}
      
      {/* HEADER */}
      <header className="p-4 border-b border-cyan-500/30 flex flex-col md:flex-row justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-40">
        <h1 className="glitch-text text-2xl md:text-3xl tracking-widest text-center" onClick={handleEnterFullscreen}>NEOFORJA</h1>
        
        {user ? (
          <div className="flex flex-col items-center md:items-end mt-2 md:mt-0">
             <span className="text-xs text-orange-400 font-mono mb-1">{user.email}</span>
             <div className="flex gap-2.5 flex-wrap justify-center">
                 <button 
                  onClick={toggleAudioMuted} 
                  className={`px-3 py-1 text-xs font-bold font-mono rounded cursor-pointer transition-all flex items-center gap-1.5 ${
                    isAudioMuted 
                      ? "bg-slate-800/80 border border-slate-700 text-slate-400 hover:bg-slate-700"
                      : "bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-25/25"
                  }`}
                  title={isAudioMuted ? "Activar efectos de sonido" : "Desactivar efectos de sonido"}
                >
                  {isAudioMuted ? <VolumeX size={14}/> : <Volume2 size={14}/>}
                  <span>{isAudioMuted ? "SND OFF" : "SND ON"}</span>
                </button>
                <button 
                  onClick={toggleFullscreen} 
                  className={`px-3 py-1 text-xs font-bold font-mono rounded cursor-pointer transition-all flex items-center gap-1.5 ${
                    isFullscreen 
                      ? "bg-red-500/20 border border-red-500 text-red-400 hover:bg-red-500/35"
                      : "bg-cyan-500/10 border border-cyan-500 text-cyan-400 hover:bg-cyan-500/20"
                  }`}
                  title={isFullscreen ? "Salir de pantalla completa" : "Entrar en pantalla completa"}
                >
                  {isFullscreen ? <Minimize size={14}/> : <Maximize size={14}/>}
                  <span>{isFullscreen ? "SALIR PANTALLA" : "PANTALLA COMPLETA"}</span>
                </button>
                <button onClick={() => { setShowClaimModal(true); triggerVibration(); }} className="px-3 py-1 bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 flex items-center gap-1 rounded transition-all shadow-[0_0_10px_rgba(245,158,11,0.4)] cursor-pointer">
                  <Zap size={14}/> VINCULAR COMPRA (NFC)
                </button>
                <button onClick={() => { setScannerMode('TRANSFER'); setShowScanner(true); triggerVibration(); }} className="px-3 py-1 bg-cyan-500/20 border border-cyan-500 text-cyan-400 text-xs font-bold hover:bg-cyan-500/40 flex items-center gap-1 rounded cursor-pointer">
                  <ScanLine size={14}/> INTERCAMBIAR P2P
                </button>
                <button onClick={() => logout()} className="px-2.5 py-1 bg-red-500/20 border border-red-500 text-red-500 hover:bg-red-500/40 rounded cursor-pointer">
                  <PowerOff size={14}/>
                </button>
             </div>
          </div>
        ) : (
          <button onClick={loginWithGoogle} className="mt-2 md:mt-0 font-mono font-bold text-xs bg-cyan-500 text-black px-6 py-2 uppercase hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(0,242,255,0.4)]">
            Acceso Rápido
          </button>
        )}
      </header>

      {/* MAIN */}
      <main className="flex-grow p-4 md:p-8 z-10 w-full max-w-6xl mx-auto">
        {!user ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h2 className="text-cyan-400 font-mono text-xl mb-4">IDENTIFICACIÓN NECESARIA</h2>
            <p className="text-white/60 mb-8 max-w-md">Para acceder a tus avatares de combate en la NeoForja Digital, por favor vincúlate a la red central.</p>
          </div>
        ) : (
          <>
            {/* ADMIN DASHBOARD */}
            {isAdmin && (
              <div className="mb-10 ui-border p-5 bg-orange-955/20 border-orange-500/50 rounded-lg">
                <div 
                  onClick={() => { setIsAdminPanelOpen(!isAdminPanelOpen); triggerVibration(); }} 
                  className="flex justify-between items-center border-b border-orange-500/30 pb-2 cursor-pointer select-none group"
                >
                  <h2 className="text-orange-500 text-lg font-black uppercase flex items-center gap-2 group-hover:text-orange-400 pb-1 transition-all">
                    <Shield className="w-5 h-5"/> Panel de Supervisor central
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-orange-500/10 text-orange-400 px-2.5 py-0.5 border border-orange-500/30 rounded animate-pulse">
                      {isAdminPanelOpen ? 'EXPANDIDO (CLICK PARA OCULTAR)' : 'MENU DESPLEGABLE (CLICK PARA EXTENDER)'}
                    </span>
                    {isAdminPanelOpen ? (
                      <ChevronUp className="w-5 h-5 text-orange-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-orange-400" />
                    )}
                  </div>
                </div>

                {isAdminPanelOpen && (
                  <div className="mt-5 space-y-6">
                    {/* Form to forge new physical chip */}
                    <form onSubmit={forjarNewChip} className="p-4 border border-cyan-900/40 bg-black/40 rounded-lg">
                      <h3 className="text-cyan-400 font-mono text-xs font-bold mb-3 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" /> Forjar Registro de Chip Físico Hexagonal (NFC/Venta)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                          <label className="block text-[10px] font-mono text-cyan-300 uppercase mb-1">Número de Serie (UID)</label>
                          <input 
                            type="text" 
                            value={adminUid} 
                            onChange={(e) => setAdminUid(e.target.value)}
                            placeholder="Ej. NF-1002"
                            className="w-full bg-black border border-cyan-500/30 text-white px-3 py-2 text-xs font-mono rounded focus:outline-none focus:border-cyan-500 transition-colors uppercase"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-cyan-300 uppercase mb-1">Modelo de Avatar</label>
                          <select 
                            value={adminChar} 
                            onChange={(e) => setAdminChar(e.target.value)} 
                            className="w-full bg-black border border-cyan-500/30 text-white px-3 py-2 text-xs font-mono rounded focus:outline-none focus:border-cyan-500 transition-colors"
                          >
                            {Object.keys(CHAR_DATA).map(charName => (
                              <option key={`char-${charName}`} value={charName}>
                                {charName} ({CHAR_DATA[charName].type})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <button type="submit" className="w-full bg-orange-500 text-black font-bold uppercase py-2 px-4 text-xs font-mono hover:bg-orange-400 transition-colors rounded shadow-[0_0_12px_rgba(245,158,11,0.3)] cursor-pointer">
                            FORJAR REGISTRO
                          </button>
                        </div>
                      </div>

                      {lastForgedChip && (
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                          <div className="font-mono text-xs">
                            <span className="text-green-400 font-bold uppercase">¡REGISTRO EXITOSO PARA {lastForgedChip.character}!</span>
                            <div className="text-white mt-1 select-all break-all bg-black/60 p-2 rounded border border-green-500/20 max-w-full">
                              {`${getCleanAppOrigin()}/?uid=${lastForgedChip.id}`}
                            </div>
                            <span className="text-[10px] text-green-500/60 block mt-1">Este enlace programado en el NFC abrirá automáticamente la web y auto-vinculará este personaje al escanearlo. ¡Funciona igual en Netlify!</span>
                            <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] text-amber-300 leading-relaxed font-mono">
                              💡 <strong>REGISTRO PÚBLICO SEGURO Y SOLUCIÓN A ERROR NFC:</strong> Si tu esposa o usuarios escanean esta ficha, asegúrate de haber grabado este enlace directo de Cloud Run (que comienza por <code>https://ais-pre-...</code>) en el chip. Si programaste el chip con la URL de la barra de direcciones de tu editor (<code>aistudio.google.com</code>), les dará <strong>Error 404</strong> al escanearlo porque Google mantiene protegido tu entorno privado de desarrollo. ¡Utiliza la herramienta de grabación NFC de tu móvil para reprogramar tus fichas con este enlace copiado!
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyNfcUrl(lastForgedChip.id)}
                            className={`px-3 py-2 text-xs font-mono font-black uppercase rounded cursor-pointer transition-all flex items-center gap-1.5 shrink-0 select-none ${
                              copiedId === lastForgedChip.id
                                ? "bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                                : "bg-cyan-500 text-black hover:bg-cyan-400"
                            }`}
                          >
                            {copiedId === lastForgedChip.id ? <Check size={14} /> : <Copy size={14} />}
                            {copiedId === lastForgedChip.id ? "COPIADO" : "COPIAR URL"}
                          </button>
                        </div>
                      )}
                      <p className="text-[10px] text-cyan-500/60 mt-2 font-mono">
                        * Al forjar un chip, se guarda disponible en la base de datos hasta que el usuario lo escanee vía NFC o ingrese su número de serie manual.
                      </p>
                    </form>

                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Recycle flow */}
                      <button onClick={() => { setScannerMode('ADMIN_RECYCLE'); setShowScanner(true); triggerVibration(); }} className="flex-1 bg-gradient-to-r from-red-650/10 to-orange-650/10 border border-orange-500 text-orange-400 p-3 font-mono text-xs tracking-widest hover:bg-orange-650/25 flex justify-center items-center gap-2 rounded transition-all cursor-pointer">
                        <Trash2 className="w-4 h-4"/> RECICLAJE (ESCANEAR DE INTERRUPCIÓN / RETORNO)
                      </button>
                      
                      {/* Seed test values */}
                      <button 
                        type="button"
                        onClick={async () => {
                          const tests = [
                            { id: "NF-TEST101", char: "AURUM" },
                            { id: "NF-TEST102", char: "CY-Draco" },
                            { id: "NF-TEST103", char: "VOXEL" }
                          ];
                          for (const t of tests) {
                            await setDoc(doc(db, "inventario_disponible", t.id), {
                              personaje: t.char,
                              owner_id: null,
                              added_at: new Date().toISOString()
                            });
                          }
                          showSystemToast("Creado lote demo libre: NF-TEST101, NF-TEST102, and NF-TEST103. Puedes copiar cualquiera para vincularlo como cliente.", "LOTE DEMO DESPLEGADO");
                        }} 
                        className="border border-cyan-800 text-cyan-400 bg-cyan-950/20 hover:bg-cyan-900/30 px-3 py-2 text-xs font-mono flex items-center justify-center rounded cursor-pointer gap-1"
                      >
                        🚀 Instalar Lote Demo Central
                      </button>

                      {/* Reset learning limits for testing */}
                      <button 
                        type="button"
                        onClick={resetTestingAttacks}
                        className="border border-amber-500 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2 text-xs font-mono flex items-center justify-center rounded cursor-pointer gap-1.5"
                      >
                        ⚡ Reiniciar Clics Diarios (Test)
                      </button>
                    </div>

                    {/* Display inventory filters & counts */}
                    <div>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3">
                        <h3 className="text-cyan-400 text-xs font-bold font-mono tracking-wider uppercase flex items-center gap-2">
                          <ScanLine className="w-3.5 h-3.5 text-cyan-400" /> Inventariado de la red central ({allChips.length} registros)
                        </h3>
                        
                        <div className="flex bg-black/60 border border-cyan-800/50 p-1 rounded gap-1">
                          <button 
                            onClick={() => setAdminInventoryFilter('all')} 
                            className={`px-3 py-1 text-[10px] font-mono uppercase rounded transition-colors cursor-pointer ${adminInventoryFilter === 'all' ? 'bg-cyan-500 text-black font-bold' : 'text-cyan-400 hover:bg-cyan-950/40'}`}
                          >
                            Todos ({allChips.length})
                          </button>
                          <button 
                            onClick={() => setAdminInventoryFilter('available')} 
                            className={`px-3 py-1 text-[10px] font-mono uppercase rounded transition-colors cursor-pointer ${adminInventoryFilter === 'available' ? 'bg-cyan-500 text-black font-bold' : 'text-cyan-400 hover:bg-cyan-950/40'}`}
                          >
                            En Tienda ({allChips.filter(c => !c.owner_id).length})
                          </button>
                          <button 
                            onClick={() => setAdminInventoryFilter('claimed')} 
                            className={`px-3 py-1 text-[10px] font-mono uppercase rounded transition-colors cursor-pointer ${adminInventoryFilter === 'claimed' ? 'bg-cyan-500 text-black font-bold' : 'text-cyan-400 hover:bg-cyan-950/40'}`}
                          >
                            Vendido ({allChips.filter(c => !!c.owner_id).length})
                          </button>
                        </div>
                      </div>

                      <div className="max-h-48 overflow-y-auto font-mono text-xs text-white/80 space-y-1 bg-black/40 border border-cyan-900/30 rounded p-2.5">
                        {allChips.filter(c => {
                          if (adminInventoryFilter === 'available') return !c.owner_id;
                          if (adminInventoryFilter === 'claimed') return !!c.owner_id;
                          return true;
                        }).length === 0 ? (
                          <div className="text-center py-4 text-cyan-700 font-bold">NINGÚN REGISTRO DETECTADO PARA ESTE FILTRO</div>
                        ) : (
                          allChips.filter(c => {
                            if (adminInventoryFilter === 'available') return !c.owner_id;
                            if (adminInventoryFilter === 'claimed') return !!c.owner_id;
                            return true;
                          }).map(c => (
                            <div key={`chip-admin-${c.id}`} className="flex justify-between items-center border-b border-cyan-950/35 py-1.5 hover:bg-cyan-950/10 px-1">
                              <div className="flex items-center gap-2">
                                <span className="text-cyan-300 font-bold"># {c.id}</span>
                                <span className="text-white bg-black/30 px-1.5 py-0.5 rounded border border-cyan-950 text-[10px]">{c.personaje}</span>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <button 
                                  onClick={() => {
                                    setLastForgedChip({ id: c.id, character: c.personaje });
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className="p-1 px-2 rounded border border-cyan-500/30 text-cyan-400 bg-cyan-950/10 hover:bg-cyan-500/20 text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer transition-all"
                                  title="Mostrar enlace NFC en panel principal para reprogramar"
                                >
                                  <Link className="w-3 h-3" />
                                  <span>Regenerar Link</span>
                                </button>
                                <button 
                                  onClick={() => copyNfcUrl(c.id)}
                                  className={`p-1 px-2 rounded border text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                    copiedId === c.id 
                                      ? "bg-green-500 text-black border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]" 
                                      : "border-cyan-500/30 text-cyan-400 bg-cyan-950/10 hover:bg-cyan-500/20"
                                  }`}
                                  title="Copiar URL NFC para grabación física"
                                >
                                  {copiedId === c.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedId === c.id ? "Copiado" : "NFC"}</span>
                                </button>
                                <span className={`text-[10px] px-1.5 py-1 rounded ${c.owner_id ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                                  {c.owner_id ? `Dueño: ${c.owner_id.substring(0,8)}...` : 'TIENDA / LIBRE'}
                                </span>
                                <button 
                                  onClick={() => deleteChipFromSystem(c.id)}
                                  className={`p-1 rounded transition-all cursor-pointer flex items-center gap-1 border text-xs ${
                                    primedDeleteId === c.id 
                                      ? "bg-red-500 text-black border-red-500 px-2 py-0.5 text-[9px] uppercase font-bold animate-pulse" 
                                      : "text-red-500 hover:text-red-400 border-transparent hover:border-red-500/20 hover:bg-red-500/10"
                                  }`}
                                  title={primedDeleteId === c.id ? "Hacer clic de nuevo para CONFIRMAR BORRADO PERMANENTE" : "Eliminar permanentemente de la NeoForja"}
                                >
                                  {primedDeleteId === c.id ? (
                                    <span>¡ELIMINAR!</span>
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SENDA DE APRENDIZAJE PROGRESS DASHBOARD */}
            <div className="mb-8 p-5 bg-cyan-950/20 border border-cyan-500/30 rounded-lg backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-cyan-400 font-mono tracking-widest text-sm font-black uppercase flex items-center gap-2">
                    <Zap className="text-cyan-400 animate-pulse w-4 h-4" /> SENDA DE APRENDIZAJE (ENTRENAMIENTO)
                  </h3>
                  <p className="text-xs text-white/50 font-mono mt-1">
                    Entrena ataques diariamente para calibrar los microprocesadores de combate y desbloquear modificadores estéticos.
                  </p>
                </div>
                <div className="text-right flex flex-col md:items-end">
                  <span className="text-xs text-cyan-500 font-mono font-bold">TOTAL ENTRENADO: <span className="text-amber-400 font-extrabold">{ataquesTotales} ★</span></span>
                  <span className="text-[10px] text-white/40 font-mono">Firma activa acumulativa</span>
                  
                  {user && (
                    <button
                      type="button"
                      onClick={resetTestingAttacks}
                      className="mt-2 text-[9px] font-mono border border-amber-500/40 text-amber-400 bg-amber-500/5 hover:bg-amber-500/15 py-1 px-2.5 rounded cursor-pointer transition-all uppercase font-medium self-end"
                      title="Reiniciar tu nivel de senda y la experiencia de tus chips para realizar pruebas"
                    >
                      ⚡ Reiniciar Senda y Chips (Test)
                    </button>
                  )}
                </div>
              </div>

              {/* Progress and Limits */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Daily limit gauge */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-cyan-300">Entrenamiento Diario En Curso:</span>
                    <span className="text-cyan-300 font-bold">{ataquesHoy} / 15 ataques</span>
                  </div>
                  <div className="w-full bg-cyan-950/60 rounded h-2.5 overflow-hidden border border-cyan-500/20">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-amber-500 h-full transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                      style={{ width: `${Math.min(100, (ataquesHoy / 15) * 100)}%` }} 
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-white/35 font-mono">
                    <span>Regeneración diaria</span>
                    <span>15 Clics Máx/Día</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ÁLBUM DIGITAL / COLECCIÓN DE NEOCAMPONES */}
            {(() => {
              const unlockedCharactersCount = Object.keys(CHAR_DATA).filter(charName => 
                inventory.some(chip => chip.personaje === charName)
              ).length;
              return (
                <div className="mb-10 p-6 md:p-8 bg-gradient-to-b from-slate-900/40 via-black/85 to-black border-2 border-cyan-500/20 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.05)] relative overflow-hidden">
                  {/* Cyber grid lines background effect */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.015)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                  <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-5 border-b border-cyan-500/10 relative z-10">
                    <div>
                      <h3 className="text-cyan-400 font-display tracking-[0.25em] text-sm md:text-base font-black uppercase flex items-center gap-2">
                        <ScanLine className="text-cyan-400 animate-pulse w-5 h-5" /> ÁLBUM DE COLECCIÓN DIGITAL
                      </h3>
                      <p className="text-[11px] text-white/50 font-mono mt-1.5 max-w-2xl leading-relaxed">
                        Desbloquea los seis neocampones de combate de la central física de NeoForja. Registrar un nuevo personaje por primera vez activa la <span className="text-amber-400 font-bold uppercase tracking-wider animate-pulse font-mono">+15 EXP Sinergia de Álbum</span>, potenciando simultáneamente a todo tu escuadrón.
                      </p>
                    </div>
                    <div className="bg-cyan-950/40 border-2 border-cyan-500/40 px-4 py-2 rounded-lg font-mono text-xs flex items-center justify-between gap-4 self-stretch md:self-auto shadow-[0_0_15px_rgba(6,182,212,0.12)]">
                      <span className="text-cyan-400 font-bold uppercase tracking-wider text-[10px]">COLECCIÓN COMPLETA:</span>
                      <span className="text-amber-400 font-black text-sm">{unlockedCharactersCount} / 6 REGISTRADOS</span>
                    </div>
                  </div>

                  {/* Grid of 6 Album Stickers - Highly visible, spacious grid column spacing */}
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 relative z-10">
                    {Object.keys(CHAR_DATA).map(charName => {
                      const char = CHAR_DATA[charName];
                      const matchingChips = inventory.filter(chip => chip.personaje === charName);
                      const isUnlocked = matchingChips.length > 0;
                      const config = getRarityConfig(char.type);
                      
                      const ownedCount = matchingChips.length;
                      const highestLevel = isUnlocked ? Math.max(...matchingChips.map(c => c.level || 1)) : 1;
                      
                      return (
                        <div 
                          key={`album-char-${charName}`}
                          className={`relative backdrop-blur-md rounded-xl p-5 border-2 transition-all duration-300 flex flex-col items-center justify-between text-center group ${
                            isUnlocked 
                              ? `bg-black/65 border-cyan-500/25 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]` 
                              : `bg-slate-950/30 border-slate-900/60 opacity-60 hover:opacity-100 hover:border-cyan-500/30`
                          }`}
                        >
                          {/* Inner scanner line effect for aesthetics */}
                          {isUnlocked && (
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500/35 to-transparent animate-[scanline_3s_ease-in-out_infinite] pointer-events-none" />
                          )}

                          {/* Cybernetic Corner Indicators */}
                          <div className={`absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 ${isUnlocked ? 'border-cyan-400/50' : 'border-slate-800'} opacity-60`} />
                          <div className={`absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 ${isUnlocked ? 'border-cyan-400/50' : 'border-slate-800'} opacity-60`} />
                          <div className={`absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 ${isUnlocked ? 'border-cyan-400/50' : 'border-slate-800'} opacity-60`} />
                          <div className={`absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 ${isUnlocked ? 'border-cyan-400/50' : 'border-slate-800'} opacity-60`} />

                          {/* Card Illustration Wrapper - 2.5x times larger for extreme clarity */}
                          <div className={`relative w-28 h-28 sm:w-32 sm:h-32 mb-4 flex items-center justify-center p-2 rounded-lg bg-black/45 border ${isUnlocked ? 'border-cyan-500/10' : 'border-slate-900/80'} overflow-hidden`}>
                            {isUnlocked ? (
                              <>
                                <img 
                                  src={char.img} 
                                  alt={charName} 
                                  className="h-full w-full object-contain filter drop-shadow-[0_0_8px_rgba(6,182,212,0.35)] transition-transform duration-500 group-hover:scale-115" 
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                              </>
                            ) : (
                              <>
                                <img 
                                  src={char.img} 
                                  alt={charName} 
                                  className="h-full w-full object-contain select-none pointer-events-none transition-transform duration-500 group-hover:scale-105" 
                                  style={{
                                    filter: 'brightness(0) drop-shadow(0 0 5px rgba(6,182,212,0.25)) opacity(0.2) grayscale(100%)'
                                  }}
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-x-0 bottom-2 flex justify-center z-10">
                                  <span className="text-[8px] font-mono text-red-400/90 border border-red-500/30 bg-red-950/90 px-1.5 py-0.5 rounded leading-none flex items-center gap-0.5 font-bold tracking-tight">
                                    🔒 BLOQUEADO
                                  </span>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Text labels and attributes */}
                          <div className="w-full flex flex-col items-center">
                            <span className={`text-xs font-display font-black uppercase tracking-widest ${isUnlocked ? config.textClass : 'text-slate-500'}`}>
                              {charName}
                            </span>
                            <span className="text-[8px] font-mono font-bold text-white/30 uppercase mt-0.5 tracking-wider">
                              CLASE: {char.class}
                            </span>
                          </div>

                          {/* Unlock status with details, passive descriptions or scanning directions */}
                          <div className="w-full mt-3 pt-2.5 border-t border-cyan-500/15 flex flex-col items-center justify-center min-h-[36px]">
                            {isUnlocked ? (
                              <div className="flex flex-col items-center gap-1 leading-none">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[8.5px] font-black font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-500/20 px-2 py-0.5 rounded uppercase leading-none">
                                    X{ownedCount} PROPIOS
                                  </span>
                                  <span className="text-[8.5px] font-mono text-amber-500 font-extrabold leading-none">
                                    LVL {highestLevel}
                                  </span>
                                </div>
                                <span className="text-[8px] font-mono text-white/40 mt-1 max-w-[120px] truncate leading-none" title={char.passive}>
                                  {char.passive}
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1 leading-none">
                                <span className="text-[8px] font-bold font-mono text-slate-500 uppercase tracking-wider">
                                  DESVINCULADO
                                </span>
                                <span className="text-[7px] font-mono text-cyan-500/40 uppercase max-w-[110px] leading-snug select-none">
                                  ESCANEA QR DE CHIP
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* USER INVENTORY */}
            <div className="flex justify-between items-end mb-6 border-b border-cyan-800 pb-2">
              <h2 className="glitch-text text-xl md:text-2xl tracking-widest text-cyan-400">TUS CHIPS</h2>
              {inventory.length === 0 && (
                <button onClick={assignRandomChip} className="border border-green-500 text-green-400 bg-green-500/10 px-3 py-1 text-xs font-mono font-bold hover:bg-green-500/20">
                  OBTENER CHIP DE INICIO
                </button>
              )}
            </div>
            
            {inventory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {inventory.map(chip => (
                  <RenderCard key={`card-${chip.id}`} chip={chip} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-cyan-900 font-mono text-sm border border-dashed border-cyan-900 bg-cyan-950/10">
                NO HAY CHIPS ASIGNADOS A ESTA SEÑAL DE IDENTIDAD.
              </div>
            )}
          </>
        )}
      </main>

      {/* FOOTER - Social Links */}
      <footer className="mt-auto p-6 border-t border-cyan-900/50 bg-black/80 flex flex-col items-center gap-4 z-40 relative">
        <div className="text-cyan-600/50 font-mono text-xs uppercase text-center">NeoForja Digital &copy; 2026 // Conexión Establecida</div>
        <div className="flex gap-6">
          <a href="https://wa.me/50250897593" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:text-white transition-colors duration-300" title="Contactar vía WhatsApp"><Whatsapp className="w-5 h-5"/></a>
          <a href="https://www.instagram.com/neoforja.digital" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:text-white transition-colors duration-300" title="Seguir en Instagram"><Instagram className="w-5 h-5"/></a>
          <a href="https://www.facebook.com/neoforjanos" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:text-white transition-colors duration-300" title="Seguir en Facebook"><Facebook className="w-5 h-5"/></a>
        </div>
      </footer>

      {/* QR MODAL */}
      <AnimatePresence>
        {showQRModal.active && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="ui-border bg-[#000] p-6 max-w-sm w-full font-mono relative">
              <h3 className="text-orange-500 text-center font-bold mb-2">MODO TRANSFERENCIA P2P</h3>
              <p className="text-xs text-white/50 text-center mb-6">El operador receptor debe escanear este código. UID: {showQRModal.uid}</p>
              <div className="bg-white p-4" style={{ height: "auto", margin: "0 auto", maxWidth: 200, width: "100%" }}>
                  <QRCode
                    size={256}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    value={JSON.stringify({ type: "QR_TRANSFER", chipId: showQRModal.uid, char: showQRModal.charName })}
                    viewBox={`0 0 256 256`}
                  />
              </div>
              <button onClick={() => setShowQRModal({ active: false, uid: null, charName: null })} className="w-full mt-6 border border-cyan-500 text-cyan-500 py-2 text-sm hover:bg-cyan-500 hover:text-black font-bold uppercase transition-colors">
                Cerrar Enlace
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SCANNER MODAL */}
      <AnimatePresence>
        {showScanner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <h3 className="text-cyan-400 font-mono text-center font-bold mb-4 uppercase tracking-widest">
              {scannerMode === 'ADMIN_RECYCLE' 
                ? 'RECICLADO DE CHIPS (ADMIN)' 
                : scannerMode === 'CLAIM_CHIP' 
                ? 'ESCANEAR QR DE CHIP COMPRADO' 
                : 'ESCANER DE TRANSFERENCIA P2P'}
            </h3>
            
            <div id="reader" className="w-full max-w-md bg-white border-2 border-cyan-500 p-1 rounded-sm shadow-[0_0_20px_rgba(6,182,212,0.3)]"></div>
            
            <div className="w-full max-w-md mt-6 pb-2 border-t border-cyan-500/30 pt-4 text-center">
              <p className="text-xs text-white/50 mb-3 font-mono">O utiliza el sensor NFC nativo (si es compatible)</p>
              {isIframe ? (
                <div className="p-3 bg-red-500/15 border border-red-500/30 rounded text-left mb-3">
                  <p className="text-xs text-amber-400 font-bold uppercase mb-1 font-mono">⚠️ Acceso NFC en iFrame Restringido</p>
                  <p className="text-[10px] text-white/80 leading-relaxed font-mono">
                    Las APIs de hardware NFC están bloqueadas por el navegador dentro de este marco de desarrollo. Para usar la antena NFC nativa de tu dispositivo, abre la app en una pestaña directa externa:
                  </p>
                  <a
                    href={getCleanAppOrigin()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2.5 inline-flex items-center gap-1.5 w-full justify-center bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold font-mono py-1.5 px-3 rounded text-[10px] uppercase transition-all shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                  >
                    <Maximize className="w-3 h-3" /> Abrir en Otra Pestaña
                  </a>
                </div>
              ) : (
                <>
                  {nfcReading ? (
                    <div className="py-2 text-center text-cyan-400 font-mono text-xs animate-pulse font-bold">
                      LEYENDO NFC... ACERCA LA FICHA AL DISPOSITIVO
                    </div>
                  ) : (
                    <button onClick={startNFCScan} className="bg-cyan-500/10 border border-cyan-500 text-cyan-400 py-2 px-6 rounded text-xs font-bold uppercase transition-all hover:bg-cyan-500 hover:text-black">
                      Activar Antena NFC
                    </button>
                  )}
                  {nfcError && <p className="text-[10px] text-red-400 mt-2 font-mono mx-auto max-w-[250px]">{nfcError}</p>}
                  {nfcSuccessMsg && <p className="text-[10px] text-green-400 mt-2 font-mono">{nfcSuccessMsg}</p>}
                </>
              )}
            </div>

            <button onClick={() => setShowScanner(false)} className="mt-6 border border-red-500 text-red-500 py-2.5 px-8 font-mono text-xs font-bold hover:bg-red-500/20 transition-all uppercase rounded cursor-pointer">
              Cancelar Escaneo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PHYSICAL CLAIM MODAL */}
      <AnimatePresence>
        {showClaimModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="ui-border bg-black p-6 max-w-md w-full font-mono relative my-8 border-amber-500/80 rounded-lg shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              
              {/* Corner amber details */}
              <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-500"></span>
              <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-500"></span>
              <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-500"></span>
              <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-500"></span>

              <h3 className="text-amber-400 text-center text-lg font-black tracking-wider uppercase mb-1">
                Vincular Chip de Combate
              </h3>
              <p className="text-[10px] text-white/50 text-center mb-6">
                Sincroniza tu ficha física hexagonal a través del sensor NFC de tu terminal.
              </p>
              
              {/* SECTION 1: NFC READER */}
              <div className="mb-6 p-4 border border-amber-500/20 bg-amber-500/5 rounded">
                <h4 className="text-xs text-amber-300 font-bold uppercase mb-2 flex items-center gap-1.5">
                  ⚡ Escáner NFC integrado
                </h4>
                <p className="text-[11px] text-white/70 mb-3">
                  Apoya tu ficha hexagonal física de combate en la antena lectora NFC de tu dispositivo.
                </p>
                
                {isIframe ? (
                  <div className="p-3 bg-red-500/15 border border-red-500/30 rounded text-left">
                    <p className="text-xs text-amber-400 font-bold uppercase mb-1 font-mono">⚠️ Acceso NFC en iFrame Restringido</p>
                    <p className="text-[10px] text-white/80 leading-relaxed font-mono">
                      La antena NFC de tu móvil no se puede activar dentro de la vista previa de AI Studio. Para usar el hardware de lectura nativo de tu teléfono, debes abrir la aplicación en tu navegador de manera directa:
                    </p>
                    <a
                      href={getCleanAppOrigin()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2.5 inline-flex items-center gap-1.5 w-full justify-center bg-amber-500 hover:bg-amber-400 text-black font-extrabold font-mono py-1.5 px-3 rounded text-[10px] uppercase transition-all shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                    >
                      <Maximize className="w-3 h-3" /> Abrir en Otra Pestaña
                    </a>
                  </div>
                ) : (
                  <>
                    {nfcReading ? (
                      <div className="py-4 text-center">
                        <span className="inline-block w-6 h-6 border-2 border-t-transparent border-amber-400 rounded-full animate-spin mb-2"></span>
                        <p className="text-xs text-amber-400 animate-pulse font-bold uppercase">BUSCANDO SEÑAL DE FICHA NFC...</p>
                      </div>
                    ) : (
                      <button 
                        onClick={startNFCScan} 
                        className="w-full bg-amber-500 text-black py-2 rounded text-xs font-bold uppercase hover:bg-amber-400 transition-colors cursor-pointer"
                      >
                        ACTIVAR ANTENA NFC
                      </button>
                    )}

                    {nfcError && (
                      <div className="mt-3 text-[10px] text-red-400 border-l-2 border-red-500 pl-2">
                        {nfcError}
                      </div>
                    )}
                    {nfcSuccessMsg && (
                      <div className="mt-3 text-[10px] text-green-400 border-l-2 border-green-500 pl-2">
                        {nfcSuccessMsg}
                      </div>
                    )}
                  </>
                )}

                {/* NFC Simulator list for web previews */}
                <div className="mt-4 pt-3 border-t border-amber-500/15">
                  <span className="text-[9px] text-amber-400/80 font-bold block mb-1 uppercase">Simulador de Ficha NFC (iFrame / PC):</span>
                  <p className="text-[9px] text-white/40 mb-2">
                    Para probar en computadoras sin lector físico NFC, selecciona una ficha de la tienda para simular el contacto:
                  </p>
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                    {allChips.filter(c => !c.owner_id).length === 0 ? (
                      <div className="text-[10px] text-cyan-600 italic font-bold">No hay fichas libres en tienda. Crea una nueva en el Panel de Supervisor.</div>
                    ) : (
                      allChips.filter(c => !c.owner_id).map(c => (
                        <button 
                          key={`free-chip-${c.id}`} 
                          onClick={() => {
                            claimPhysicalChip(c.id).then(success => {
                              if (success) {
                                setShowClaimModal(false);
                              }
                            });
                          }}
                          className="w-full bg-black/50 border border-cyan-800/40 hover:border-cyan-400 hover:bg-cyan-950/20 py-1.5 px-2 text-[10px] text-cyan-400 flex justify-between rounded items-center transition-all cursor-pointer"
                        >
                          <span>ID de Ficha: {c.id}</span>
                          <span className="opacity-70 bg-cyan-950/80 px-1 py-0.5 border border-cyan-500/20 text-[9px]">Aproximar NFC [{c.personaje}] ⚡</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  setShowClaimModal(false);
                  setNfcReading(false);
                }} 
                className="w-full mt-6 border border-white/20 text-white/65 py-2 text-xs hover:bg-white/5 font-bold uppercase transition-colors rounded cursor-pointer"
              >
                Cerrar Enlace de Sincronización
              </button>
            </div>
          </motion.div>
        )}

        {/* Level Up Animation Modal */}
        {showLevelUpActive && levelUpChipId && (
          (() => {
            const upChip = inventory.find(c => c.id === levelUpChipId);
            if (!upChip) return null;
            const upChar = CHAR_DATA[upChip.personaje];
            if (!upChar) return null;
            const upConfig = getRarityConfig(upChar.type);
            return (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
              >
                <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-amber-500/20 via-transparent to-transparent animate-pulse duration-1000" />
                
                <motion.div 
                  initial={{ scale: 0.5, y: 100, rotate: -5 }}
                  animate={{ scale: 1, y: 0, rotate: 0 }}
                  exit={{ scale: 0.5, y: 100, rotate: 5 }}
                  transition={{ type: "spring", damping: 18, stiffness: 200 }}
                  className="w-full max-w-sm p-6 bg-black border-2 border-amber-500 rounded-lg shadow-[0_0_60px_rgba(245,158,11,0.6)] relative overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-to-tr from-cyan-500/10 via-amber-500/20 to-purple-500/10 animate-spin duration-[10000ms] pointer-events-none" />
                  
                  <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-400"></span>
                  <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-400"></span>
                  <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-400"></span>
                  <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-400"></span>

                  <div className="text-center relative z-10 flex flex-col items-center">
                    <span className="inline-block text-[9px] font-mono tracking-[0.3em] text-amber-400 bg-amber-950/40 px-3 py-1 border border-amber-500/50 rounded animate-bounce mb-3">
                      ⚡ MEJORA CRÍTICA COMPLETADA ⚡
                    </span>
                    
                    <h2 className="text-2xl font-black font-mono text-white tracking-widest uppercase mb-1 glitch-text">
                      ¡NIVEL INCREMENTADO!
                    </h2>
                    <p className="text-[10px] text-cyan-300 font-mono uppercase mb-4 tracking-wider">
                      RECALIBRACIÓN DE SEÑAL COGNITIVA
                    </p>
                    
                    <div className="relative w-40 h-40 flex items-center justify-center my-2 bg-gradient-to-b from-amber-500/10 to-transparent rounded-full p-4 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                      <motion.img 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: [0.8, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
                        src={upChar.img} 
                        alt={upChip.personaje} 
                        className="h-32 object-contain filter drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] z-20" 
                      />
                      <div className="absolute inset-0 bg-amber-400/15 rounded-full scale-125 blur-xl animate-pulse" />
                    </div>

                    <h3 className={`text-xl font-black ${upConfig.textClass} mt-2 mb-1`}>
                      {upChip.personaje}
                    </h3>
                    <p className="text-[10px] text-white/50 font-mono uppercase">ID: {upChip.id}</p>

                    <div className="flex items-center gap-4 my-4 bg-white/5 px-6 py-2 border border-white/10 rounded-full font-mono text-sm">
                      <span className="text-white/60">NIVEL {levelUpPrevLevel}</span>
                      <span className="text-amber-400 font-extrabold animate-pulse">➜</span>
                      <span className="text-green-400 font-extrabold text-base tracking-widest drop-shadow-[0_0_6px_rgba(34,197,94,0.5)]">
                        NIVEL {levelUpNewLevel}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-300 font-sans px-2 leading-relaxed mb-6">
                      El microprocesador de <span className="font-bold text-cyan-400">{upChip.personaje}</span> ha incrementado su frecuencia de reloj. Sus atributos de combate base ahora son un 10% más poderosos y eficientes.
                    </p>
                    
                    <button 
                      onClick={() => {
                        setShowLevelUpActive(false);
                        setLevelUpChipId(null);
                        triggerVibration();
                      }}
                      className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-amber-500 text-black font-mono font-black text-xs uppercase py-3 rounded tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                    >
                      CONTINUAR ENTRENAMIENTO
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()
        )}

        {/* Custom Glassmorphic Cyber Alert Toast Modal */}
        {systemToast && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setSystemToast(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-md p-6 bg-[#080d19]/95 border-2 border-cyan-500/80 rounded-lg shadow-[0_0_50px_rgba(6,182,212,0.35)] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></span>
              <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></span>
              <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></span>
              <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></span>
              
              <div className="text-center">
                <span className="inline-block text-[10px] font-mono tracking-[0.25em] text-cyan-400 bg-cyan-950/40 px-3 py-1 border border-cyan-800/60 rounded mb-4">
                  ⚡ TRANSMISIÓN DEL SISTEMA ⚡
                </span>
                
                <h3 className="text-xs font-display font-bold tracking-widest text-amber-400 uppercase mb-3">
                  {systemToast.title}
                </h3>
                
                <p className="text-xs text-gray-200 font-sans leading-relaxed mb-5 whitespace-pre-line px-1">
                  {systemToast.message}
                </p>
                
                <button 
                  onClick={() => {
                    setSystemToast(null);
                    triggerVibration();
                  }}
                  className="w-full bg-gradient-to-r from-cyan-600 to-[#0e7490] hover:from-cyan-500 hover:to-cyan-600 text-white font-mono font-bold text-xs uppercase py-3 rounded tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  Aceptar y Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
