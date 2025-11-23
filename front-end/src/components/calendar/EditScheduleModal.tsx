"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { MemberCalendarForm } from "@/components/calendar/MemberCalendarForm";
import { Calendar as CalendarType, CalendarData } from "@/core";
import { Settings } from "lucide-react";

interface EditScheduleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    calendar?: CalendarType;
    onSubmit: (data: CalendarData) => void | Promise<void>;
    isLoading?: boolean;
}

export function EditScheduleModal({
    open,
    onOpenChange,
    calendar,
    onSubmit,
    isLoading,
}: EditScheduleModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl min-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        {calendar ? "Edit Schedule" : "Create Schedule"}
                    </DialogTitle>
                </DialogHeader>
                <MemberCalendarForm
                    calendar={calendar}
                    onSubmit={onSubmit}
                    onCancel={() => onOpenChange(false)}
                    isLoading={isLoading}
                />
            </DialogContent>
        </Dialog>
    );
}
