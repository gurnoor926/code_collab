
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

function Welcome() {
  return <h1>Welcome to CodeCollab</h1>;
}

describe("Welcome Component", () => {
  it("should render the welcome message", () => {
    render(<Welcome />);

    expect(
      screen.getByRole("heading", {
        name: "Welcome to CodeCollab",
      })
    ).toBeInTheDocument();
  });
});
