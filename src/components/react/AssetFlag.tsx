import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Props {
  alreadyDisabled: boolean;
  id: string;
  allowedText: string;
  disabledText: string;
  permission: boolean;
  flag: boolean;
  setFlag: (flag: boolean) => void;
}

export default function AssetFlag({
  alreadyDisabled,
  id,
  allowedText,
  disabledText,
  permission,
  flag,
  setFlag,
}: Props) {
  const lbl = (
    <Label htmlFor={id}>{permission || alreadyDisabled ? allowedText : disabledText}</Label>
  );

  if (alreadyDisabled || !permission) {
    return (
      <>
        <Checkbox checked={false} id={id} className="align-middle mr-2" disabled />
        {lbl}
        <br />
      </>
    );
  }

  return (
    <>
      <Checkbox
        onClick={(e) => {
          const target = e.target as Element;
          const isChecked = target.getAttribute("aria-checked") === "true";
          setFlag(!isChecked);
        }}
        id={id}
        className="align-middle mr-2"
        checked={flag}
      />
      {lbl}
      <br />
    </>
  );
}
