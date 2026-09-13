import { useState, type CSSProperties } from "react";
import { KOREAN_NAMES, POSITIONS } from "../game/data";
import { pick } from "../game/engine";
import { SPEED_LABEL } from "../game/store";
import type { Position, Speed } from "../game/types";

const SPEED_HELP: Record<Speed, string> = {
  normal: "캠프 · 전반기 · 후반기 · 오프시즌을 직접 선택합니다. 이야기를 꼼꼼히 즐기는 속도입니다.",
  fast: "전반기 이벤트는 자동으로 넘어갑니다. 한 시즌이 한 템포 빨라집니다.",
  turbo: "캠프와 오프시즌을 직접 고르고 전반기·후반기는 자동 처리합니다. 커리어를 빠르게 훑는 속도입니다.",
};

export function Setup({
  onStart,
  hasSave,
  onContinue,
}: {
  onStart: (name: string, position: Position, speed: Speed) => void;
  hasSave: boolean;
  onContinue: () => void;
}) {
  const [name, setName] = useState(() => pick(KOREAN_NAMES));
  const [position, setPosition] = useState<Position>("내야수");
  const [speed, setSpeed] = useState<Speed>("normal");

  return (
    <main className="setup">
      <section className="setup-copy" style={{ "--setup-art": `url('${import.meta.env.BASE_URL}moments/overseas.webp')` } as CSSProperties}>
        <div className="eyebrow">Baseball Career Simulator · 2026</div>
        <h1>
          당신의 이름으로,
          <br />
          <em>야구 인생을 쓰다.</em>
        </h1>
        <p>
          드래프트, 국제계약, 육성선수, 혹은 기적 같은 즉시 데뷔. 시작점은 무작위지만
          그 다음은 당신의 선택입니다. 매 시즌 찾아오는 갈림길이 능력치를 바꾸고,
          성적이 계약을 바꾸고, 계약이 커리어를 바꿉니다.
        </p>
        <div className="odds">
          <span>KBO 퓨처스 50%</span>
          <span>KBO 1군 12%</span>
          <span>NPB 육성 16%</span>
          <span>MiLB 18%</span>
          <span className="rare">MLB 즉시 데뷔 4%</span>
        </div>
      </section>

      <section className="creator">
        {hasSave && <div className="continue-panel"><span className="eyebrow">WELCOME BACK</span><h2>다음 시즌이 기다립니다</h2><button className="btn primary block" onClick={onContinue}>저장된 커리어 이어하기</button><p className="tiny">이 브라우저에 저장된 선수로 계속합니다.</p></div>}
        <div className="step">
          <i>01</i>
          <div>
            <small>DESTINY DRAFT</small>
            <h2>당신은 누구입니까?</h2>
          </div>
        </div>

        <label className="field">
          <span>선수 이름</span>
          <input
            value={name}
            maxLength={12}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
          />
        </label>

        <div className="field">
          <span>주 포지션</span>
          <div className="pos-grid">
            {POSITIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={position === p.id ? "on" : ""}
                onClick={() => setPosition(p.id)}
                aria-pressed={position === p.id}
              >
                <b>{p.label}</b>
                <small>{p.desc}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>진행 속도</span>
          <div className="speed-grid" role="radiogroup" aria-label="진행 속도">
            {(["normal", "fast", "turbo"] as const).map((sp) => (
              <button
                key={sp}
                type="button"
                role="radio"
                aria-checked={speed === sp}
                className={speed === sp ? "on" : ""}
                onClick={() => setSpeed(sp)}
              >
                <b>{SPEED_LABEL[sp].name}</b>
                <small>{SPEED_LABEL[sp].desc}</small>
              </button>
            ))}
          </div>
          <p className="speed-help">{SPEED_HELP[speed]} 게임 중에도 상단에서 바꿀 수 있습니다.</p>
        </div>

        <div className="lottery">
          <small>SCOUTING LOTTERY</small>
          <b>시작 구단 · 리그 · 계약이 무작위로 결정됩니다</b>
          <span>잠재력도 함께 정해집니다. 선수 화면에서 등급을 확인하고 나만의 성장 방향을 선택하세요.</span>
        </div>

        <button className="btn primary block" onClick={() => onStart(name, position, speed)}>
          운명적인 첫 오퍼 열기 →
        </button>
        <p className="tiny">진행 상황은 브라우저에 자동 저장됩니다</p>
      </section>
    </main>
  );
}
