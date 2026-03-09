import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Tooltip from "./Tooltip";

describe("Tooltip", () => {
  it("abre no clique e fecha ao clicar fora", () => {
    render(
      <div>
        <Tooltip text="Texto de apoio" />
        <button type="button">Fora</button>
      </div>
    );

    const trigger = screen.getByRole("button", { name: /mais informa/i });

    fireEvent.click(trigger);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(screen.getByText("Texto de apoio")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("button", { name: "Fora" }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("fecha ao pressionar Escape", () => {
    render(<Tooltip text="Texto de apoio" />);

    const trigger = screen.getByRole("button", { name: /mais informa/i });
    fireEvent.click(trigger);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
