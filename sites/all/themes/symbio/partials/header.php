<header class="header" itemscope itemtype="http://schema.org/WPHeader">
  <div class="top-info">
    <div class="row">
      <div class="large-5 columns">
        <div class="notice">
          <?php if ($page['notices']): ?>
          <?php print render($page['notices']); ?>
          <?php endif; ?>
        </div>
      </div>
      <div class="large-7 columns">
        <nav class="right-top-info-links">
        <?php
          global $user;

          if($user->uid)
          {
            // user is logged in
          }
          else
          { ?>
          <a href="<?php print $base_path; ?>user/login"><?php print t('Login'); ?>&nbsp;<svg class="icon icon-login"><use xlink:href="#icon-login"></use></svg></a>
          <?php }
        ?>
        <?php if ($secondary_menu): ?>
          <?php print theme('links__system_secondary_menu', array('links' => $secondary_menu, 'attributes' => array('id' => 'secondary-menu-links', 'class' => array('links', 'inline', 'clearfix')), 'heading' => t('Main menu'))); ?>
        <?php endif; ?>
        </nav>
        <?php if ($page['desktop_search']): ?>
          <?php print render($page['desktop_search']); ?>
        <?php endif; ?>
      </div>
    </div>
  </div>
  <div class="title-bar">
    <div class="title-bar-left">
      <button class="menu-icon" type="button" data-open="offCanvas"></button>
    </div>
    <a href="<?php print render($front_page); ?>" class="responsive-svg-container" title="<?php print t('Home'); ?>" rel="home">
      <svg class="title-bar-logo" aria-labelledby="logo" preserveAspectRatio="xMinYMin meet"><use xlink:href="#logo"/></svg>
    </a>
    <div class="title-bar-right">
    </div>
  </div>
  <div class="row column desktop-top-bar">
    <nav class="top-bar" itemscope itemtype="http://schema.org/SiteNavigationElement">
      <div class="top-bar-left">
        <a href="<?php print render($front_page); ?>" class="top-bar-logo-wrapper responsive-svg-container" title="<?php print t('Home'); ?>" rel="home">
          <svg class="top-bar-logo" aria-labelledby="logo" preserveAspectRatio="xMinYMin meet"><use xlink:href="#logo"/></svg>
        </a>
      </div>
      <div class="top-bar-right">
        <?php if ($main_menu): ?>
          <div class="navigation main-menu">
            <?php print theme('links__system_main_menu', array(
              'links' => $main_menu,
              'attributes' => array(
                'id' => 'main-menu-links',
                'class' => 'dropdown menu',
                'data-dropdown-menu' => '',
              ),
            )); ?>
          </div>
        <?php endif; ?>
      </div>
    </nav>
  </div>
  <?php if(drupal_is_front_page()):?>
  <section id="main-content" class="banner" role="banner">
    <div class="row column">
      <?php if ($page['header']): ?>
        <?php print render($page['header']); ?>
      <?php endif; ?>
      <?php if ($page['home_page_slogan']): ?>
        <div class="enter-bottom" itemprop="headline"><?php print render($page['home_page_slogan']); ?></div>
      <?php endif; ?>
      <?php if ($page['home_page_paragraph']): ?>
        <div class="enter-bottom-1" itemprop="description"><?php print render($page['home_page_paragraph']); ?></div>
      <?php endif; ?>
      <?php if ($page['home_page_bottom_header']): ?>
        <div class="enter-bottom-2"><?php print render($page['home_page_bottom_header']); ?></div>
      <?php endif; ?>
    </div>
  </section>
  <?php endif;?>
</header>