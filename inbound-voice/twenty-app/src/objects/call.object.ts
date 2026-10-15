/**
 * NOT RUN. Written from Twenty's objects.mdx. Field type names other than TEXT, SELECT, DATE_TIME, FULL_NAME,
 * ADDRESS are guesses (NUMBER, LINKS, PHONES) and must be checked against FieldType in twenty-sdk.
 * Replace every universalIdentifier with a generated UUID and never change it afterwards.
 */
import { defineObject, FieldType } from "twenty-sdk/define";

const outcome = (value: string, label: string, position: number, color: string) => ({ value, label, position, color });

export default defineObject({
  universalIdentifier: "00000000-0000-4000-8000-0000000000a1",
  nameSingular: "call",
  namePlural: "calls",
  labelSingular: "Call",
  labelPlural: "Calls",
  description: "An inbound phone call handled by the voice agent",
  icon: "IconPhoneCall",
  writability: "APPLICATION" as never, // MetadataWritability.APPLICATION: only this app's logic functions can write
  fields: [
    { universalIdentifier: "00000000-0000-4000-8000-0000000000b1", name: "providerCallId", type: FieldType.TEXT, label: "Provider call ID", icon: "IconKey" },
    { universalIdentifier: "00000000-0000-4000-8000-0000000000b2", name: "direction", type: FieldType.TEXT, label: "Direction", icon: "IconArrowDownLeft" },
    { universalIdentifier: "00000000-0000-4000-8000-0000000000b3", name: "startedAt", type: FieldType.DATE_TIME, label: "Started at", icon: "IconClock", isNullable: true, defaultValue: null },
    { universalIdentifier: "00000000-0000-4000-8000-0000000000b4", name: "endedAt", type: FieldType.DATE_TIME, label: "Ended at", icon: "IconClock", isNullable: true, defaultValue: null },
    { universalIdentifier: "00000000-0000-4000-8000-0000000000b5", name: "durationSeconds", type: FieldType.NUMBER as never, label: "Duration (s)", icon: "IconHourglass", isNullable: true, defaultValue: null },
    {
      universalIdentifier: "00000000-0000-4000-8000-0000000000b6",
      name: "outcome",
      type: FieldType.SELECT,
      label: "Outcome",
      icon: "IconFlag",
      defaultValue: "'NO_OUTCOME'",
      options: [
        outcome("BOOKED", "Booked", 0, "green"),
        outcome("MESSAGE_TAKEN", "Message taken", 1, "blue"),
        outcome("TRANSFERRED", "Transferred", 2, "turquoise"),
        outcome("TRANSFER_FAILED", "Transfer failed", 3, "orange"),
        outcome("INFO_GIVEN", "Info given", 4, "gray"),
        outcome("CALLBACK_REQUESTED", "Callback requested", 5, "purple"),
        outcome("OPTED_OUT", "Opted out", 6, "red"),
        outcome("NO_OUTCOME", "No outcome", 7, "gray"),
      ],
    },
    { universalIdentifier: "00000000-0000-4000-8000-0000000000b7", name: "summary", type: FieldType.TEXT, label: "Summary", icon: "IconNotes", isNullable: true, defaultValue: null },
    { universalIdentifier: "00000000-0000-4000-8000-0000000000b8", name: "recordingUrl", type: FieldType.LINKS as never, label: "Recording", icon: "IconPlayerPlay", isNullable: true, defaultValue: null },
    { universalIdentifier: "00000000-0000-4000-8000-0000000000b9", name: "transcriptUrl", type: FieldType.LINKS as never, label: "Transcript", icon: "IconFileText", isNullable: true, defaultValue: null },
  ],
});
