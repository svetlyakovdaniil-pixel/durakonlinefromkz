# V14 Desktop Layout Check

Desktop layout shows:
- Row 1: Gamepad icon + "Казахский Дурак" | Онлайн badge | ID 1 badge | Avatar | svetlyakovdaniil | Logout icon
- Row 2 (separated by border): "Комнаты" | "+ Создать комнату" button
- Content area: "Пока нет комнат" placeholder

Desktop looks good. Now need to verify mobile layout works correctly.
The mobile layout (sm:hidden) has:
- Row 1: Title + Logout
- Row 2: Centered large avatar
- Row 3: Name + ID below avatar
- Row 4: Онлайн status
- Row 5: Комнаты + Создать (with border-t separator)

Wait - looking at the user's screenshot again:
1. "Комнаты" and "+ Создать" should go DOWN to the green areas (below the current header area)
2. "Онлайн" should go to where "Комнаты" was (left side, below the header)
3. Avatar centered and large where "Онлайн" currently is
4. Name below avatar, ID next to name
5. Logout stays as is

The green areas in the screenshot are BELOW the header border, at the same level as room cards would be.
So the layout should be:
- Header: Title + Logout | Avatar centered | Name + ID | Онлайн
- Then below header: Комнаты (left) + Создать (right)
- Then room cards

This matches what I implemented. Let me verify the mobile view.
