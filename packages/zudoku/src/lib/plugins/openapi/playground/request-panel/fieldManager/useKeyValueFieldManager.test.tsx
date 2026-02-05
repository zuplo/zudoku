import { render, renderHook } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { act, type ReactNode } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { describe, expect, it } from "vitest";
import {
  type KeyValueField,
  useKeyValueFieldManager,
} from "../useKeyValueFieldManager.js";

/**
 * @vitest-environment happy-dom
 */

type TestFormData = { fields: KeyValueField[] };

const createWrapper = (defaultValues?: Partial<TestFormData>) => {
  const Wrapper = ({ children }: { children: ReactNode }) => {
    const form = useForm<TestFormData>({
      defaultValues: {
        fields: [],
        ...defaultValues,
      },
    });
    return <FormProvider {...form}>{children}</FormProvider>;
  };
  return Wrapper;
};

describe("useKeyValueFieldManager", () => {
  describe("initialization", () => {
    it("should initialize with one empty field when no fields exist", async () => {
      const { result } = renderHook(
        () => {
          const form = useFormContext<TestFormData>();
          return {
            manager: useKeyValueFieldManager({
              control: form.control,
              name: "fields",
              defaultValue: { name: "", value: "", active: false },
            }),
            form,
          };
        },
        { wrapper: createWrapper({ fields: [] }) },
      );

      expect(result.current.manager.fields).toHaveLength(1);

      const firstField = result.current.form.getValues("fields.0");
      expect(firstField).toEqual({ name: "", value: "", active: false });
    });

    it("should not add field when fields already exist", async () => {
      const { result } = renderHook(
        () => {
          const form = useFormContext<TestFormData>();
          return {
            manager: useKeyValueFieldManager({
              control: form.control,
              name: "fields",
              defaultValue: { name: "", value: "", active: false },
            }),
            form,
          };
        },
        {
          wrapper: createWrapper({
            fields: [{ name: "test", value: "value", active: true }],
          }),
        },
      );

      // One existing + one empty auto-appended
      expect(result.current.manager.fields).toHaveLength(2);
    });
  });

  describe("auto-append behavior", () => {
    it("should auto-append an empty field when last field has content", async () => {
      const { result } = renderHook(
        () => {
          const form = useFormContext<TestFormData>();
          return {
            manager: useKeyValueFieldManager({
              control: form.control,
              name: "fields",
              defaultValue: { name: "", value: "", active: false },
            }),
            form,
          };
        },
        { wrapper: createWrapper({ fields: [] }) },
      );

      expect(result.current.manager.fields).toHaveLength(1);

      act(() => result.current.manager.setValue(0, "name", "test"));

      // Should auto-append another field
      expect(result.current.manager.fields).toHaveLength(2);

      const secondField = result.current.form.getValues("fields.1");
      expect(secondField).toEqual({ name: "", value: "", active: false });
    });

    it("should not auto-append if last field is empty", async () => {
      const { result } = renderHook(
        () => {
          const form = useFormContext<TestFormData>();
          return {
            manager: useKeyValueFieldManager({
              control: form.control,
              name: "fields",
              defaultValue: { name: "", value: "", active: false },
            }),
            form,
          };
        },
        { wrapper: createWrapper({ fields: [] }) },
      );

      expect(result.current.manager.fields).toHaveLength(1);

      act(() => result.current.manager.setValue(0, "name", "test"));

      expect(result.current.manager.fields).toHaveLength(2);

      act(() => result.current.manager.setValue(0, "name", ""));

      // Should not append more fields
      expect(result.current.manager.fields).toHaveLength(1);
    });
  });

  describe("auto-remove behavior", () => {
    it("should auto-remove empty fields except the last one", async () => {
      const { result } = renderHook(
        () => {
          const form = useFormContext<TestFormData>();
          return {
            manager: useKeyValueFieldManager({
              control: form.control,
              name: "fields",
              defaultValue: { name: "", value: "", active: false },
            }),
            form,
          };
        },
        {
          wrapper: createWrapper({
            fields: [
              { name: "field1", value: "value1", active: true },
              { name: "", value: "", active: false },
              { name: "field3", value: "value3", active: true },
            ],
          }),
        },
      );

      // Should remove the empty field in the middle
      expect(result.current.manager.fields).toHaveLength(3); // 2 filled + 1 empty at end

      const fields = result.current.form.getValues("fields");
      expect(fields[0]).toMatchObject({ name: "field1", value: "value1" });
      expect(fields[1]).toMatchObject({ name: "field3", value: "value3" });
      expect(fields[2]).toMatchObject({ name: "", value: "" });
    });

    it("should keep at least one field even if empty", async () => {
      const { result } = renderHook(
        () => {
          const form = useFormContext<TestFormData>();
          return {
            manager: useKeyValueFieldManager({
              control: form.control,
              name: "fields",
              defaultValue: { name: "", value: "", active: false },
            }),
            form: form,
          };
        },
        {
          wrapper: createWrapper({
            fields: [{ name: "", value: "", active: false }],
          }),
        },
      );

      expect(result.current.manager.fields).toHaveLength(1);
    });

    it("should focus name field when current row is auto-removed", async () => {
      const TestComponent = () => {
        const form = useFormContext<TestFormData>();
        const manager = useKeyValueFieldManager({
          control: form.control,
          name: "fields",
          defaultValue: { name: "", value: "", active: false },
        });

        return manager.fields.map((f, i) => (
          <div key={f.id}>
            <input
              {...manager.getNameInputProps(i)}
              data-testid={`name-${i}`}
            />
            <input
              {...manager.getValueInputProps(i)}
              data-testid={`value-${i}`}
            />
          </div>
        ));
      };

      const Wrapper = createWrapper({
        fields: [
          { name: "first", value: "value1", active: true },
          { name: "second", value: "value2", active: true },
        ],
      });
      const { getByTestId } = render(
        <Wrapper>
          <TestComponent />
        </Wrapper>,
      );

      const firstNameInput = getByTestId("name-0") as HTMLInputElement;
      const firstValueInput = getByTestId("value-0") as HTMLInputElement;

      // Clear both fields to trigger auto-remove
      await userEvent.click(firstNameInput);
      await userEvent.clear(firstNameInput);
      await userEvent.clear(firstValueInput);

      // After auto-remove, focus should be on the name field at index 0
      // (which now contains what was the second row)
      expect(document.activeElement).toBe(getByTestId("name-0"));
    });
  });

  describe("active state synchronization", () => {
    it("should set active to true when field has content", async () => {
      const { result } = renderHook(
        () => {
          const form = useFormContext<TestFormData>();
          return {
            manager: useKeyValueFieldManager({
              control: form.control,
              name: "fields",
              defaultValue: { name: "", value: "", active: false },
            }),
            form,
          };
        },
        { wrapper: createWrapper({ fields: [] }) },
      );

      expect(result.current.manager.fields).toHaveLength(1);

      act(() => result.current.manager.setValue(0, "name", "test"));

      expect(result.current.form.getValues("fields.0.active")).toBe(true);
    });

    it("should set active to false when field becomes empty", async () => {
      const { result } = renderHook(
        () => {
          const form = useFormContext<TestFormData>();
          return {
            manager: useKeyValueFieldManager({
              control: form.control,
              name: "fields",
              defaultValue: { name: "", value: "", active: false },
            }),
            form,
          };
        },
        {
          wrapper: createWrapper({
            fields: [{ name: "test", value: "value", active: true }],
          }),
        },
      );

      expect(result.current.manager.fields.length).toBeGreaterThan(0);

      act(() => {
        result.current.manager.setValue(0, "name", "");
        result.current.manager.setValue(0, "value", "");
      });

      expect(result.current.form.getValues("fields.0.active")).toBe(false);
    });
  });

  describe("File type support", () => {
    it("should handle File values correctly", async () => {
      const { result } = renderHook(
        () => {
          const form = useFormContext<TestFormData>();
          return {
            manager: useKeyValueFieldManager({
              control: form.control,
              name: "fields",
              defaultValue: { name: "", value: "", active: false },
            }),
            form: form,
          };
        },
        { wrapper: createWrapper({ fields: [] }) },
      );

      expect(result.current.manager.fields).toHaveLength(1);

      const testFile = new File(["content"], "test.txt", {
        type: "text/plain",
      });

      act(() => result.current.manager.setValue(0, "value", testFile));

      const value = result.current.manager.getValue(0, "value");
      expect(value).toBeInstanceOf(File);
      expect((value as File).name).toBe("test.txt");
    });

    it("should not remove fields with File values even if name is empty", async () => {
      const testFile = new File(["content"], "test.txt", {
        type: "text/plain",
      });

      const { result } = renderHook(
        () => {
          const form = useFormContext<TestFormData>();
          return {
            manager: useKeyValueFieldManager({
              control: form.control,
              name: "fields",
              defaultValue: { name: "", value: "", active: false },
              isEmpty: (item) => {
                if (item.value instanceof File) return false;
                return !item.name && !item.value;
              },
            }),
            form,
          };
        },
        { wrapper: createWrapper({ fields: [] }) },
      );

      expect(result.current.manager.fields).toHaveLength(1);

      act(() => result.current.manager.setValue(0, "value", testFile));

      // Should auto-append another field since current has content
      expect(result.current.manager.fields).toHaveLength(2);

      // The field with File should not be removed
      const value = result.current.manager.getValue(0, "value");
      expect(value).toBeInstanceOf(File);
    });
  });

  describe("keyboard navigation", () => {
    it("should focus value field when Enter is pressed in name field", async () => {
      const TestComponent = () => {
        const form = useFormContext<TestFormData>();
        const manager = useKeyValueFieldManager({
          control: form.control,
          name: "fields",
          defaultValue: { name: "", value: "", active: false },
        });

        return manager.fields.map((f, i) => (
          <div key={f.id}>
            <input
              {...manager.getNameInputProps(i)}
              data-testid={`name-${i}`}
            />
            <input
              {...manager.getValueInputProps(i)}
              data-testid={`value-${i}`}
            />
          </div>
        ));
      };

      const Wrapper = createWrapper({ fields: [] });
      const { getByTestId } = render(
        <Wrapper>
          <TestComponent />
        </Wrapper>,
      );

      expect(getByTestId("name-0")).toBeInTheDocument();

      const nameInput = getByTestId("name-0");
      const valueInput = getByTestId("value-0");

      nameInput.focus();
      await userEvent.keyboard("{Enter}");

      expect(document.activeElement).toBe(valueInput);
    });

    it("should focus next row's name field when Enter is pressed in value field", async () => {
      const TestComponent = () => {
        const form = useFormContext<TestFormData>();
        const manager = useKeyValueFieldManager({
          control: form.control,
          name: "fields",
          defaultValue: { name: "", value: "", active: false },
        });

        return (
          <div>
            {manager.fields.map((f, i) => (
              <div key={`field-${f.id}`}>
                <input
                  {...manager.getNameInputProps(i)}
                  data-testid={`name-${i}`}
                />
                <input
                  {...manager.getValueInputProps(i)}
                  data-testid={`value-${i}`}
                />
              </div>
            ))}
          </div>
        );
      };

      const Wrapper = createWrapper({
        fields: [{ name: "test", value: "value", active: true }],
      });
      const { getByTestId } = render(
        <Wrapper>
          <TestComponent />
        </Wrapper>,
      );

      expect(getByTestId("value-0")).toBeInTheDocument();
      expect(getByTestId("name-1")).toBeInTheDocument();

      const valueInput = getByTestId("value-0");
      const nextNameInput = getByTestId("name-1");

      valueInput.focus();
      await userEvent.keyboard("{Enter}");

      expect(document.activeElement).toBe(nextNameInput);
    });

    it("should focus previous row's value when Backspace is pressed in empty name field", async () => {
      const TestComponent = () => {
        const form = useFormContext<TestFormData>();
        const manager = useKeyValueFieldManager({
          control: form.control,
          name: "fields",
          defaultValue: { name: "", value: "", active: false },
        });

        return manager.fields.map((f, i) => (
          <div key={f.id}>
            <input
              {...manager.getNameInputProps(i)}
              data-testid={`name-${i}`}
            />
            <input
              {...manager.getValueInputProps(i)}
              data-testid={`value-${i}`}
            />
          </div>
        ));
      };

      const Wrapper = createWrapper({
        fields: [
          { name: "test1", value: "value1", active: true },
          { name: "", value: "", active: false },
        ],
      });
      const { getByTestId } = render(
        <Wrapper>
          <TestComponent />
        </Wrapper>,
      );

      expect(getByTestId("name-1")).toBeInTheDocument();

      const nameInput = getByTestId("name-1");
      const prevValueInput = getByTestId("value-0");

      nameInput.focus();
      await userEvent.keyboard("{Backspace}");

      expect(document.activeElement).toBe(prevValueInput);
    });

    it("should focus current row's name when Backspace is pressed in empty value field", async () => {
      const TestComponent = () => {
        const form = useFormContext<TestFormData>();
        const manager = useKeyValueFieldManager({
          control: form.control,
          name: "fields",
          defaultValue: { name: "", value: "", active: false },
        });

        return manager.fields.map((f, i) => (
          <div key={f.id}>
            <input
              {...manager.getNameInputProps(i)}
              data-testid={`name-${i}`}
            />
            <input
              {...manager.getValueInputProps(i)}
              data-testid={`value-${i}`}
            />
          </div>
        ));
      };

      const Wrapper = createWrapper({ fields: [] });
      const { getByTestId } = render(
        <Wrapper>
          <TestComponent />
        </Wrapper>,
      );

      expect(getByTestId("value-0")).toBeInTheDocument();

      const nameInput = getByTestId("name-0");
      const valueInput = getByTestId("value-0");

      valueInput.focus();
      await userEvent.keyboard("{Backspace}");

      expect(document.activeElement).toBe(nameInput);
    });

    it("should focus current row's value when ArrowRight is pressed at end of name field", async () => {
      const TestComponent = () => {
        const form = useFormContext<TestFormData>();
        const manager = useKeyValueFieldManager({
          control: form.control,
          name: "fields",
          defaultValue: { name: "", value: "", active: false },
        });

        return manager.fields.map((f, i) => (
          <div key={f.id}>
            <input
              {...manager.getNameInputProps(i)}
              data-testid={`name-${i}`}
            />
            <input
              {...manager.getValueInputProps(i)}
              data-testid={`value-${i}`}
            />
          </div>
        ));
      };

      const Wrapper = createWrapper({
        fields: [{ name: "test", value: "value", active: true }],
      });
      const { getByTestId } = render(
        <Wrapper>
          <TestComponent />
        </Wrapper>,
      );

      const nameInput = getByTestId("name-0") as HTMLInputElement;
      const valueInput = getByTestId("value-0");

      nameInput.focus();
      nameInput.setSelectionRange(4, 4); // Move cursor to end of "test"
      await userEvent.keyboard("{ArrowRight}");

      expect(document.activeElement).toBe(valueInput);
    });

    it("should focus previous row's value when ArrowLeft is pressed at start of name field", async () => {
      const TestComponent = () => {
        const form = useFormContext<TestFormData>();
        const manager = useKeyValueFieldManager({
          control: form.control,
          name: "fields",
          defaultValue: { name: "", value: "", active: false },
        });

        return manager.fields.map((f, i) => (
          <div key={f.id}>
            <input
              {...manager.getNameInputProps(i)}
              data-testid={`name-${i}`}
            />
            <input
              {...manager.getValueInputProps(i)}
              data-testid={`value-${i}`}
            />
          </div>
        ));
      };

      const Wrapper = createWrapper({
        fields: [
          { name: "test1", value: "value1", active: true },
          { name: "test2", value: "value2", active: true },
        ],
      });
      const { getByTestId } = render(
        <Wrapper>
          <TestComponent />
        </Wrapper>,
      );

      const nameInput = getByTestId("name-1") as HTMLInputElement;
      const prevValueInput = getByTestId("value-0");

      nameInput.focus();
      nameInput.setSelectionRange(0, 0); // Move cursor to start
      await userEvent.keyboard("{ArrowLeft}");

      expect(document.activeElement).toBe(prevValueInput);
    });

    it("should not navigate with ArrowLeft when at start of first name field", async () => {
      const TestComponent = () => {
        const form = useFormContext<TestFormData>();
        const manager = useKeyValueFieldManager({
          control: form.control,
          name: "fields",
          defaultValue: { name: "", value: "", active: false },
        });

        return manager.fields.map((f, i) => (
          <div key={f.id}>
            <input
              {...manager.getNameInputProps(i)}
              data-testid={`name-${i}`}
            />
            <input
              {...manager.getValueInputProps(i)}
              data-testid={`value-${i}`}
            />
          </div>
        ));
      };

      const Wrapper = createWrapper({
        fields: [{ name: "test", value: "value", active: true }],
      });
      const { getByTestId } = render(
        <Wrapper>
          <TestComponent />
        </Wrapper>,
      );

      const nameInput = getByTestId("name-0") as HTMLInputElement;

      nameInput.focus();
      nameInput.setSelectionRange(0, 0);
      await userEvent.keyboard("{ArrowLeft}");

      // Should remain focused on the same field
      expect(document.activeElement).toBe(nameInput);
    });

    it("should focus current row's name when ArrowLeft is pressed at start of value field", async () => {
      const TestComponent = () => {
        const form = useFormContext<TestFormData>();
        const manager = useKeyValueFieldManager({
          control: form.control,
          name: "fields",
          defaultValue: { name: "", value: "", active: false },
        });

        return manager.fields.map((f, i) => (
          <div key={f.id}>
            <input
              {...manager.getNameInputProps(i)}
              data-testid={`name-${i}`}
            />
            <input
              {...manager.getValueInputProps(i)}
              data-testid={`value-${i}`}
            />
          </div>
        ));
      };

      const Wrapper = createWrapper({
        fields: [{ name: "test", value: "value", active: true }],
      });
      const { getByTestId } = render(
        <Wrapper>
          <TestComponent />
        </Wrapper>,
      );

      const nameInput = getByTestId("name-0");
      const valueInput = getByTestId("value-0") as HTMLInputElement;

      valueInput.focus();
      valueInput.setSelectionRange(0, 0);
      await userEvent.keyboard("{ArrowLeft}");

      expect(document.activeElement).toBe(nameInput);
    });

    it("should focus next row's name when ArrowRight is pressed at end of value field", async () => {
      const TestComponent = () => {
        const form = useFormContext<TestFormData>();
        const manager = useKeyValueFieldManager({
          control: form.control,
          name: "fields",
          defaultValue: { name: "", value: "", active: false },
        });

        return manager.fields.map((f, i) => (
          <div key={f.id}>
            <input
              {...manager.getNameInputProps(i)}
              data-testid={`name-${i}`}
            />
            <input
              {...manager.getValueInputProps(i)}
              data-testid={`value-${i}`}
            />
          </div>
        ));
      };

      const Wrapper = createWrapper({
        fields: [
          { name: "test1", value: "value1", active: true },
          { name: "test2", value: "value2", active: true },
        ],
      });
      const { getByTestId } = render(
        <Wrapper>
          <TestComponent />
        </Wrapper>,
      );

      const valueInput = getByTestId("value-0") as HTMLInputElement;
      const nextNameInput = getByTestId("name-1");

      valueInput.focus();
      valueInput.setSelectionRange(6, 6); // Move cursor to end of "value1"
      await userEvent.keyboard("{ArrowRight}");

      expect(document.activeElement).toBe(nextNameInput);
    });

    it("should not navigate with arrow keys when cursor is in the middle of text", async () => {
      const TestComponent = () => {
        const form = useFormContext<TestFormData>();
        const manager = useKeyValueFieldManager({
          control: form.control,
          name: "fields",
          defaultValue: { name: "", value: "", active: false },
        });

        return manager.fields.map((f, i) => (
          <div key={f.id}>
            <input
              {...manager.getNameInputProps(i)}
              data-testid={`name-${i}`}
            />
            <input
              {...manager.getValueInputProps(i)}
              data-testid={`value-${i}`}
            />
          </div>
        ));
      };

      const Wrapper = createWrapper({
        fields: [{ name: "test", value: "value", active: true }],
      });
      const { getByTestId } = render(
        <Wrapper>
          <TestComponent />
        </Wrapper>,
      );

      const nameInput = getByTestId("name-0") as HTMLInputElement;

      nameInput.focus();
      nameInput.setSelectionRange(2, 2); // Cursor in middle of "test"
      await userEvent.keyboard("{ArrowLeft}");

      // Should remain focused on the same field
      expect(document.activeElement).toBe(nameInput);

      nameInput.setSelectionRange(2, 2);
      await userEvent.keyboard("{ArrowRight}");

      // Should still remain focused on the same field
      expect(document.activeElement).toBe(nameInput);
    });
  });

  describe("helper methods", () => {
    it("should provide correct props for checkbox", async () => {
      const { result } = renderHook(
        () => {
          const form = useFormContext<TestFormData>();
          return {
            manager: useKeyValueFieldManager({
              control: form.control,
              name: "fields",
              defaultValue: { name: "", value: "", active: false },
            }),
            form,
          };
        },
        {
          wrapper: createWrapper({
            fields: [{ name: "test", value: "value", active: true }],
          }),
        },
      );

      expect(result.current.manager.fields.length).toBeGreaterThan(0);

      const checkboxProps = result.current.manager.getCheckboxProps(0);
      expect(checkboxProps).toHaveProperty("checked");
      expect(checkboxProps).toHaveProperty("disabled");
      expect(checkboxProps).toHaveProperty("onCheckedChange");
      expect(checkboxProps.checked).toBe(true);
    });

    it("should provide correct props for remove button", async () => {
      const { result } = renderHook(
        () => {
          const form = useFormContext<TestFormData>();
          return {
            manager: useKeyValueFieldManager({
              control: form.control,
              name: "fields",
              defaultValue: { name: "", value: "", active: false },
            }),
            form,
          };
        },
        {
          wrapper: createWrapper({
            fields: [
              { name: "test1", value: "value1", active: true },
              { name: "test2", value: "value2", active: true },
            ],
          }),
        },
      );

      expect(result.current.manager.fields.length).toBeGreaterThan(1);

      const removeProps = result.current.manager.getRemoveButtonProps(0);
      expect(removeProps).toHaveProperty("onClick");
      expect(removeProps).toHaveProperty("disabled");
      expect(removeProps.disabled).toBe(false);

      // Last field should be disabled
      const lastIndex = result.current.manager.fields.length - 1;
      const lastRemoveProps =
        result.current.manager.getRemoveButtonProps(lastIndex);
      expect(lastRemoveProps.disabled).toBe(true);
    });
  });
});
