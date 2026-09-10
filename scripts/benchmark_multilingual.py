"""Experimental Benchmark & Verification Script for VeritasAI Milestone 3.7.

Tests all 14 languages in the registry for:
1. Language detection accuracy and confidence score.
2. XLM-RoBERTa model inference latency & predictions on original text.
3. MyMemory translation availability & presentation translation latency into English.
"""

import asyncio
import sys
import time
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.modules.translation.detector import LanguageDetector
from app.modules.translation.languages import SUPPORTED_LANGUAGES, get_language_name
from app.modules.translation.services import (
    MyMemoryTranslationProvider,
    TranslationService,
    TranslationUnavailableError,
)
from app.modules.analysis.services import AnalysisService


TEST_CORPUS = [
    {
        "code": "en",
        "name": "English",
        "text": "Scientists at the international laboratory announced a major breakthrough in clean energy today.",
    },
    {
        "code": "hi",
        "name": "Hindi",
        "text": "वैज्ञानिकों ने आज प्रयोगशाला में स्वच्छ ऊर्जा के क्षेत्र में एक महत्वपूर्ण सफलता की घोषणा की।",
    },
    {
        "code": "bn",
        "name": "Bengali",
        "text": "আন্তর্জাতিক গবেষণাগারের বিজ্ঞানীরা আজ পরিচ্ছন্ন শক্তির ক্ষেত্রে একটি যুগান্তকারী সাফল্যের ঘোষণা দিয়েছেন।",
    },
    {
        "code": "ta",
        "name": "Tamil",
        "text": "சர்வதேச ஆய்வக விஞ்ஞானிகள் இன்று தூய ஆற்றல் துறையில் ஒரு முக்கிய முன்னேற்றத்தை அறிவித்துள்ளனர்.",
    },
    {
        "code": "te",
        "name": "Telugu",
        "text": "అంతర్జాతీయ ప్రయోగశాల శాస్త్రవేత్తలు నేడు స్వచ్ఛమైన ఇంధన రంగంలో ఒక పెద్ద విజయాన్ని ప్రకటించారు.",
    },
    {
        "code": "mr",
        "name": "Marathi",
        "text": "आंतरराष्ट्रीय प्रयोगशाळेतील शास्त्रज्ञांनी आज स्वच्छ ऊर्जेच्या क्षेत्रात महत्त्वपूर्ण यशाची घोषणा केली.",
    },
    {
        "code": "gu",
        "name": "Gujarati",
        "text": "આંતરરાષ્ટ્રીય પ્રયોગશાળાના વૈજ્ઞાનિકોએ આજે સ્વચ્છ ઊર્જા ક્ષેત્રે એક મોટી સિદ્ધિની જાહેરાત કરી છે.",
    },
    {
        "code": "kn",
        "name": "Kannada",
        "text": "ಅಂತರರಾಷ್ಟ್ರೀಯ ಪ್ರಯೋಗಾಲಯದ ವಿಜ್ಞಾನಿಗಳು ಇಂದು ಶುದ್ಧ ಇಂಧನ ಕ್ಷೇತ್ರದಲ್ಲಿ ಮಹತ್ವದ ಪ್ರಗತಿಯನ್ನು ಘೋಷಿಸಿದ್ದಾರೆ.",
    },
    {
        "code": "ml",
        "name": "Malayalam",
        "text": "അന്താരാഷ്ട്ര ലബോറട്ടറിയിലെ ശാസ്ത്രജ്ഞർ ഇന്ന് ശുദ്ധമായ ഊർജ്ജ മേഖലയിൽ വലിയൊരു മുന്നേറ്റം പ്രഖ്യാപിച്ചു.",
    },
    {
        "code": "pa",
        "name": "Punjabi",
        "text": "ਅੰਤਰਰਾਸ਼ਟਰੀ ਪ੍ਰਯੋਗਸ਼ਾਲਾ ਦੇ ਵਿਗਿਆਨੀਆਂ ਨੇ ਅੱਜ ਸਾਫ਼ ਊਰਜਾ ਦੇ ਖੇਤਰ ਵਿੱਚ ਇੱਕ ਵੱਡੀ ਪ੍ਰਾਪਤੀ ਦਾ ਐਲਾਨ ਕੀਤਾ ਹੈ।",
    },
    {
        "code": "ur",
        "name": "Urdu",
        "text": "بین الاقوامی تجربہ گاہ کے سائنسدانوں نے آج صاف توانائی کے شعبے میں ایک بڑی پیش رفت کا اعلان کیا ہے۔",
    },
    {
        "code": "es",
        "name": "Spanish",
        "text": "Los científicos del laboratorio internacional anunciaron hoy un gran avance en energía limpia.",
    },
    {
        "code": "fr",
        "name": "French",
        "text": "Les scientifiques du laboratoire international ont annoncé aujourd'hui une avancée majeure dans l'énergie propre.",
    },
    {
        "code": "de",
        "name": "German",
        "text": "Wissenschaftler des internationalen Labors gaben heute einen Durchbruch bei sauberer Energie bekannt.",
    },
]


async def run_benchmark():
    print("=" * 80)
    print("VERITASAI MILESTONE 3.7: MULTILINGUAL VERIFICATION & LATENCY BENCHMARK")
    print("=" * 80)

    detector = LanguageDetector()
    analysis_service = AnalysisService()
    translation_service = TranslationService(provider=MyMemoryTranslationProvider())

    results = []

    print(f"\nEvaluating {len(TEST_CORPUS)} languages from registry...\n")

    for item in TEST_CORPUS:
        code = item["code"]
        name = item["name"]
        text = item["text"]

        print(f"Testing [{code.upper()}] {name}...", end=" ", flush=True)

        # 1. Detection
        det_start = time.perf_counter()
        det_res = detector.detect_language(text)
        det_ms = round((time.perf_counter() - det_start) * 1000, 2)
        det_success = det_res.code == code

        # 2. Model inference (XLM-R)
        inf_start = time.perf_counter()
        try:
            inf_res = await analysis_service.analyze_text(text)
            inf_ms = round((time.perf_counter() - inf_start) * 1000, 2)
            cred_label = inf_res["credibility"]["label"]
            cred_conf = inf_res["credibility"]["confidence"]
            sent_label = inf_res["sentiment"]["label"]
            sent_conf = inf_res["sentiment"]["confidence"]
            inf_success = True
        except Exception as e:
            inf_ms = 0.0
            cred_label, cred_conf, sent_label, sent_conf = "ERR", 0.0, "ERR", 0.0
            inf_success = False

        # 3. Translation into English (if not already English)
        trans_success = False
        trans_ms = 0.0
        translated_text = ""
        provider_name = "mymemory"

        if code == "en":
            trans_success = True
            trans_ms = 0.0
            translated_text = text
            provider_name = "no-op"
        else:
            try:
                trans_res = await translation_service.translate(
                    text=text,
                    source_language=code,
                    target_language="en",
                )
                trans_ms = trans_res.latency_ms
                translated_text = trans_res.translated_text
                provider_name = trans_res.provider
                trans_success = len(translated_text) > 0
            except Exception as e:
                trans_ms = 0.0
                translated_text = f"FAILED: {str(e)[:50]}"
                trans_success = False

        status = "OK" if (det_success and inf_success and trans_success) else "PARTIAL"
        print(f"{status} (Det: {det_res.code} [{det_res.confidence or 0:.2f}], Infer: {inf_ms}ms, Trans: {trans_ms}ms)")

        results.append({
            "code": code,
            "name": name,
            "detected_code": det_res.code,
            "detected_conf": det_res.confidence,
            "detection_verified": det_success,
            "inference_ms": inf_ms,
            "cred_label": cred_label,
            "cred_conf": cred_conf,
            "sent_label": sent_label,
            "sent_conf": sent_conf,
            "inference_verified": inf_success,
            "translation_ms": trans_ms,
            "translation_verified": trans_success,
            "translated_sample": translated_text[:60] + ("..." if len(translated_text) > 60 else ""),
            "provider": provider_name,
        })

    print("\n" + "=" * 80)
    print("RESULTS SUMMARY TABLE")
    print("=" * 80)
    header = (
        f"{'Lang':<10} | {'Detect (conf)':<16} | {'Inference':<10} | {'Cred / Sent':<18} | {'Trans Latency':<14} | {'Status'}"
    )
    print(header)
    print("-" * 80)

    verified_count = 0
    for r in results:
        det_str = f"{r['detected_code']} ({r['detected_conf']:.2f})" if r['detected_conf'] else f"{r['detected_code']} (None)"
        cred_sent = f"{r['cred_label'][:1]}:{r['cred_conf']:.2f} / {r['sent_label'][:1]}:{r['sent_conf']:.2f}"
        status_flag = "VERIFIED" if (r['detection_verified'] and r['inference_verified'] and r['translation_verified']) else "UNVERIFIED"
        if status_flag == "VERIFIED":
            verified_count += 1
        print(
            f"{r['name']:<10} | {det_str:<16} | {r['inference_ms']:>6.1f} ms | {cred_sent:<18} | {r['translation_ms']:>8.1f} ms   | {status_flag}"
        )

    print("-" * 80)
    print(f"Total Languages Tested: {len(results)}")
    print(f"Successfully Verified Across Detection, XLM-R, and Translation: {verified_count}/{len(results)}")
    print("=" * 80)

    return results


if __name__ == "__main__":
    asyncio.run(run_benchmark())
