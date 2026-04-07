import React from "react";
import type { TaskList as TaskListType } from "store";
import TaskList from "./TaskList";
import { StyledTaskSection } from "styles";

type Props = {
  tasks: TaskListType[];
  onCardContextMenu?: (listId: string, cardId: string) => void;
};

const TaskInnerList: React.FC<Props> = ({
  tasks,
  onCardContextMenu,
}) => {
  return (
    <StyledTaskSection>
      {tasks.map(({ _id, title, cards, priority }) => (
        <TaskList
          listId={_id}
          title={title}
          cards={cards}
          priority={priority}
          onCardContextMenu={onCardContextMenu}
          key={_id}
        />
      ))}
    </StyledTaskSection>
  );
};

export default React.memo(TaskInnerList);
