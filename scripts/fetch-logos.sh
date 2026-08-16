#!/usr/bin/env bash
# 구단 로고 수집 스크립트
#   KBO/NPB -> Wikipedia (pageimages -> 실패 시 문서 내 이미지 목록에서 로고 추정)
#   MLB     -> MLB 공식 CDN (mlbstatic)
# 이미 받은 파일은 건너뜁니다. 사용: bash scripts/fetch-logos.sh
set -u
OUT="img/logo"
UA="kbo-career-sim/0.1 (personal hobby project)"
API="https://en.wikipedia.org/w/api.php"
NAP="${NAP:-3}"   # API 요청 간 대기(초) — 위키미디어 레이트 리밋 회피
nap() { sleep "$NAP"; }
mkdir -p "$OUT"

have() { [ -s "$OUT/$1.png" ] || [ -s "$OUT/$1.svg" ]; }

# 파일명(File:xxx)으로 400px 썸네일 URL 얻기
file_url() {
  curl -s -A "$UA" --get "$API" \
    --data-urlencode "action=query" --data-urlencode "format=json" \
    --data-urlencode "titles=$1" --data-urlencode "prop=imageinfo" \
    --data-urlencode "iiprop=url" --data-urlencode "iiurlwidth=400" \
    | sed -n 's/.*"thumburl":"\([^"]*\)".*/\1/p' | sed 's/\\\//\//g'
}

# 문서 제목으로 대표 이미지(pageimages) URL 얻기
page_url() {
  curl -s -A "$UA" --get "$API" \
    --data-urlencode "action=query" --data-urlencode "format=json" \
    --data-urlencode "titles=$1" --data-urlencode "prop=pageimages" \
    --data-urlencode "pithumbsize=400" \
    | sed -n 's/.*"source":"\([^"]*\)".*/\1/p' | sed 's/\\\//\//g' | sed 's/?.*//'
}

# 문서에 포함된 이미지 중 로고로 보이는 첫 파일 찾기
guess_file() {
  curl -s -A "$UA" --get "$API" \
    --data-urlencode "action=query" --data-urlencode "format=json" \
    --data-urlencode "titles=$1" --data-urlencode "prop=images" \
    --data-urlencode "imlimit=60" \
    | tr ',' '\n' | sed -n 's/.*"title":"\(File:[^"]*\)".*/\1/p' \
    | grep -viE 'commons-logo|flag |flag_|ambox|question book|oojs|icon|arrow|edit-ltr' \
    | grep -iE 'logo|insignia|emblem|cap|mark' | head -1
}

wiki_logo() {
  local slug="$1" title="$2" explicit="${3:-}"
  have "$slug" && { echo "skip  $slug"; return; }
  local src=""
  nap
  [ -n "$explicit" ] && src=$(file_url "$explicit")
  [ -z "$src" ] && { nap; src=$(page_url "$title"); }
  if [ -z "$src" ]; then
    local f
    nap; f=$(guess_file "$title")
    [ -n "$f" ] && { nap; src=$(file_url "$f"); }
  fi
  if [ -z "$src" ]; then echo "FAIL  $slug ($title)"; return; fi
  curl -s -A "$UA" -o "$OUT/$slug.png" "$src"
  if [ -s "$OUT/$slug.png" ]; then echo "ok    $slug"; else rm -f "$OUT/$slug.png"; echo "FAIL  $slug"; fi
}

mlb_logo() {
  local slug="$1" id="$2"
  have "$slug" && { echo "skip  $slug"; return; }
  curl -s -A "$UA" -o "$OUT/$slug.svg" "https://www.mlbstatic.com/team-logos/$id.svg"
  if [ -s "$OUT/$slug.svg" ]; then echo "ok    $slug"; else rm -f "$OUT/$slug.svg"; echo "FAIL  $slug"; fi
}

echo "== KBO =="
wiki_logo lg      "LG Twins"
wiki_logo hanwha  "Hanwha Eagles"   "File:Hanwha Eagles.svg"
wiki_logo samsung "Samsung Lions"
wiki_logo doosan  "Doosan Bears"    "File:Doosan Bears.svg"
wiki_logo ssg     "SSG Landers"     "File:SSG Landers.svg"
wiki_logo lotte   "Lotte Giants"
wiki_logo kt      "KT Wiz"
wiki_logo kia     "Kia Tigers"      "File:Kia Tigers logo.svg"
wiki_logo nc      "NC Dinos"        "File:NC Dinos Emblem.svg"
wiki_logo kiwoom  "Kiwoom Heroes"   "File:Kiwoom Heroes insignia.png"

echo "== NPB =="
wiki_logo yomiuri    "Yomiuri Giants"                "File:Yomiuri Giants logo.svg"
wiki_logo hanshin    "Hanshin Tigers"                "File:Hanshin tigers emblem.svg"
wiki_logo chunichi   "Chunichi Dragons"              "File:Chunichi Dragons Logo Vector.svg"
wiki_logo denabay    "Yokohama DeNA BayStars"        "File:Yokohama DeNA BayStars logo vector.svg"
wiki_logo yakult     "Tokyo Yakult Swallows"         "File:Tokyo Yakult Swallows logo.svg"
wiki_logo hiroshima  "Hiroshima Toyo Carp"           "File:Hiroshima Toyo Carp insignia.svg"
wiki_logo softbank   "Fukuoka SoftBank Hawks"        "File:Fukuoka SoftBank Hawks insignia.svg"
wiki_logo orix       "Orix Buffaloes"                "File:Orix Buffaloes insignia.svg"
wiki_logo chibalotte "Chiba Lotte Marines"
wiki_logo seibu      "Saitama Seibu Lions"
wiki_logo rakuten    "Tohoku Rakuten Golden Eagles"
wiki_logo nipponham  "Hokkaido Nippon-Ham Fighters"

echo "== MLB =="
mlb_logo angels 108;     mlb_logo dbacks 109;    mlb_logo orioles 110
mlb_logo redsox 111;     mlb_logo cubs 112;      mlb_logo reds 113
mlb_logo guardians 114;  mlb_logo rockies 115;   mlb_logo tigers 116
mlb_logo astros 117;     mlb_logo royals 118;    mlb_logo dodgers 119
mlb_logo nationals 120;  mlb_logo mets 121;      mlb_logo athletics 133
mlb_logo pirates 134;    mlb_logo padres 135;    mlb_logo mariners 136
mlb_logo giants 137;     mlb_logo cardinals 138; mlb_logo rays 139
mlb_logo rangers 140;    mlb_logo bluejays 141;  mlb_logo twins 142
mlb_logo phillies 143;   mlb_logo braves 144;    mlb_logo whitesox 145
mlb_logo marlins 146;    mlb_logo yankees 147;   mlb_logo brewers 158

echo "== done: $(ls "$OUT" | wc -l) files =="
