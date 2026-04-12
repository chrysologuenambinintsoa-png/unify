import React from 'react';
import GroupList from './GroupList';

export default function GroupSection(props) {
  // Vous pouvez passer les props nécessaires ici, par exemple user, onGroupSelect, etc.
  return (
    <section>
      <h1>Groupes</h1>
      <GroupList {...props} />
    </section>
  );
}
