<nav class="left-off-canvas-menu" role="navigation" itemscope itemtype="http://schema.org/SiteNavigationElement">
  <ul class="off-canvas-list">
    <?php if ($page['mobile_search']): ?>
    <li class="search-input">
      <?php print render($page['mobile_search']); ?>
    </li>
    <?php endif; ?>
    <li><label><?php print t('Navigation'); ?></label></li>
    <?php if ($main_menu):
      print theme('links__system_main_menu', array(
        'links' => $main_menu,
        'attributes' => array(
          'id' => 'main-menu-links',
          'class' => 'right',
        ),
      ));
      endif; ?>
    <li><label><?php print t('More'); ?></label></li>
    <?php
      global $user;

      if($user->uid)
      {
        // user is logged in
      }
      else
      { ?>
      <li><a href="<?php print $base_path; ?>user/login"><?php print t('Log in'); ?>&nbsp;<svg class="icon icon-login"><use xlink:href="#icon-login"></use></svg></a></li>
    <?php } ?>
    <?php if ($secondary_menu): ?>
    <?php print theme('links__system_secondary_menu', array('links' => $secondary_menu, 'attributes' => array('id' => 'secondary-menu-links')));?>
    <?php endif; ?>
  </ul>
</nav>