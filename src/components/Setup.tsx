import { useState } from "react";
import { KOREAN_NAMES, POSITIONS } from "../game/data";
import { pick } from "../game/engine";
import { SPEED_LABEL } from "../game/store";
import type { Position, Speed } from "../game/types";

const SPEED_HELP: Record<Speed, string> = {
  normal: "시즌마다 캠프 · 전반기 · 데드라인 이벤트를 전부 직접 고릅니다. 이야기를 꼼꼼히 즐기고 싶다면.",
  fast: "전반기 이벤트는 자동으로 넘어갑니다. 한 시즌이 한 템포 빨라집니다.",
  turbo: "스프링캠프 훈련 방침만 고르고 나머지는 자동. 커리어 전체를 빠르게 훑고 싶다면.",
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
      <section className="setup-copy">
        <div className="eyebrow">Baseball Career Simulator · 2026</div>
        <h1>
          선택하지 마세요.
          <br />
          <em>운명이 지명합니다.</em>
        </h1>
        <p>
          드래프트, 국제계약, 육성선수, 혹은 기적 같은 즉시 데뷔. 시작점은 무작위지만
          그 다음은 전부 당신의 선택입니다. 매 시즌 세 번의 갈림길이 능력치를 바꾸고,
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
          <span>
            잠재력 등급도 이때 숨겨진 채 정해집니다. 어떤 몸을 타고났는지는 몇 시즌
            뒤에야 알게 됩니다.
          </span>
        </div>

        <button className="btn primary block" onClick={() => onStart(name, position, speed)}>
          운명적인 첫 오퍼 열기 →
        </button>
        {hasSave && (
          <button className="btn ghost block" onClick={onContinue}>
            저장된 커리어 이어하기
          </button>
        )}
        <p className="tiny">진행 상황은 브라우저에 자동 저장됩니다</p>
      </section>
    </main>
  );
}
