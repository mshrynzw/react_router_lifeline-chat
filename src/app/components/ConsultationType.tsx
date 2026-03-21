interface ConsultationTypeProps {
  selectedType: "ai" | "person";
  onSelectType: (type: "ai" | "person") => void;
}

export function ConsultationType({
  selectedType,
  onSelectType,
}: ConsultationTypeProps) {
  return (
    <div className="flex justify-center gap-4 px-6 pb-6 opacity-90">
      <button
        type="button"
        onClick={() => onSelectType("ai")}
        className={`lg-glass-btn ${selectedType === "ai" ? "lg-glass-btn--active" : ""}`}
      >
        AIモード
      </button>
      <button
        type="button"
        onClick={() => onSelectType("person")}
        className={`lg-glass-btn ${selectedType === "person" ? "lg-glass-btn--active" : ""}`}
      >
        相談者モード
      </button>
    </div>
  );
}
