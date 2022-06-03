import React from 'react'
import './UserAvatar.scss';


const UserAvatar = ({ user, isSelected, onClick = null }) => {
    const imgUrl = user.cover_img_url;
    const name = (user.first_name[0] + (user.last_name ? user.last_name[0] : '')).toUpperCase();
    return (
      <div className={'asc-user-avatar' + (isSelected ? ' selected' : '')}
        style={{ cursor: onClick ? 'pointer' : 'auto' }}
        onClick={() => onClick && onClick(user)}>
        {imgUrl ?
          <img src={imgUrl} alt={user.id} /> :
          <span>{name}</span>
        }
      </div>
    );
  };
  export { UserAvatar };